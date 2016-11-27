
var socket = undefined;
var subscribed = false;
var withdrawBatchSubscribed = false;


function updateItemPrice(new_price,item_id) {
    $.ajax({
        url: '/api/v1/modify_sale_item',
        type: 'post',
        data: {
            api_key: api_key,
            item_ids: item_id,
            prices: new_price
        },
        dataType: 'json',
    }).done(function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
            noty({
                text: "Price updated.",
                type: 'info'
            });
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var responseText = JSON.parse(jqXHR.responseText);
        noty({
            text: responseText.data.error_message,
            type: 'error'
        });
    });
}

function updatePendingWithdrawalCount() {
    $.ajax({
        url: '/api/v1/get_pending_withdrawal_count',
        type: 'post',
        data: {
            api_key: api_key
        },
        dataType: 'json',
    }).done(function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
            data.data.num_items;
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log("failed to update pending withdrawal count: " + jqXHR.responseText);
    });
}


function withdrawBatch(item_ids) {
    $.ajax({
        url: '/api/v1/withdraw_item',
        type: 'post',
        data: {
            api_key: api_key,
            item_ids: item_ids
        },
        dataType: 'json',
    }).done(function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
            showTradeQueued();
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var responseText = JSON.parse(jqXHR.responseText);
        noty({
            text: responseText.data.error_message,
            type: 'error'
        });
    });
}



function sendSellItemRequest(saleBucket, btn) {
    var item_ids = Object.keys(saleBucket).join(',');
    var prices = Object.keys(saleBucket).map(function(k) {
        return saleBucket[k];
    }).join(',');
    $(btn).attr('disabled', true);
    $('.sell_item').attr('disabled', true);
    $('.jplist-pagesbox').children('button').attr('disabled', true);
    if (my_channel && !sell_item_handler_enabled) {
        sell_item_handler_enabled = true;
        my_channel.bind('make_offer', function(data) {
            if (data.status === 'success') {
                var timeout = 3000;
                if (data.text.indexOf("will be completed by Steam") > 0) {
                    timeout = 10000;
                    noty({
                        text: "Item sale(s) will be activated in 72 hours. Please wait...",
                        type: 'info',
                        timeout: timeout
                    });
                } else {
                    noty({
                        text: "Item sale(s) are now active. Please wait...",
                        type: 'info'
                    });
                }
                setTimeout(function() {
                    reloadPage(false, 'from=steam');
                }, timeout);
            } else if (data.status !== 'success' && data.status !== 'pending') {
                $('.sell_item').attr('disabled', false);
                $(btn).attr('disabled', false);
                $(btn).text('List Items for Sale Now');
                $('#securityToken').text('');
                $('.jplist-pagesbox').children('button').attr('disabled', false);
            }
            if (data.status !== 'pending') {}
        });
    }
    $.ajax({
        url: '/api/v1/list_item_for_sale',
        type: 'post',
        data: {
            api_key: $('#apiKey').text(),
            item_ids: item_ids,
            prices: prices
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))
        }
    }).done(function(data, textStatus, jqXHR) {
        if (textStatus === 'success') {
            var security_token = data.data.trade_tokens[0];
            $('#securityToken').html("You will receive a trade offer with security token <strong>" + security_token + "</strong>.");
            showTradeQueued();
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var responseText = JSON.parse(jqXHR.responseText);
        noty({
            text: responseText.data.error_message,
            type: 'error'
        });
        $(btn).text('List Items for Sale Now');
        $(btn).attr('disabled', false);
        $('.sell_item').attr('disabled', false);
        $('.jplist-pagesbox').children('button').attr('disabled', false);
    });
}



function toggleItemInSaleBucket(item_id, price) {
    if (saleBucket[item_id] === undefined) {
        saleBucket[item_id] = price;
    } else {
        delete saleBucket[item_id];
    }
    var totalItems = Object.keys(saleBucket).length;
    var totalPrices = 0.0;
    Object.keys(saleBucket).map(function(k) {
        totalPrices += parseFloat(saleBucket[k]);
    });
    totalPrices = totalPrices.toFixed(2);
    saleNoty.setText("<h5>Sell " + totalItems + " items for $" + totalPrices + "?</h5><p id='securityToken'></p>");
}


var max_items_per_trade = 50;
function toggleMassSellItem(btn) {
    var text = $(btn).text();
    var item_ids = $(btn).closest('tr').find('.item_ids').text().split(',');
    var price = $(btn).closest('tr').find('.item-price-input').val();
    var num = parseInt($(btn).closest('tr').find('.mass_sell_num_items').val());
    item_ids = item_ids.slice(0, num);
    if (Object.keys(saleBucket).length + num > max_items_per_trade && text === 'Add to List') {
        noty({
            text: "Cannot add more than " + max_items_per_trade + " items to your list.",
            type: "error"
        });
        return false;
    }
    if (text === 'Add to List') {
        $(btn).removeClass('btn-success').addClass('btn-info');
        $(btn).text('Remove');
        $(btn).closest('tr').find('.item-price-input').attr('disabled', true);
        $(btn).closest('tr').find('.mass_sell_num_items').attr('disabled', true);
    } else {
        $(btn).addClass('btn-success').removeClass('btn-info');
        $(btn).text('Add to List');
        $(btn).closest('tr').find('.item-price-input').attr('disabled', false);
        $(btn).closest('tr').find('.mass_sell_num_items').attr('disabled', false);
    }
    for (var i = 0; i < item_ids.length; i++) {
        toggleItemInSaleBucket(item_ids[i], price);
    }
}
function toggleSellItem(btn) {
    var text = $(btn).text();
    var item_id = $(btn).closest('.item-icon').find('.item_id').text();
    var price = $(btn).closest('.item-icon').find('.item-price-input').val();
    if (Object.keys(saleBucket).length >= max_items_per_trade && text === 'Add to List') {
        noty({
            text: "Cannot add more than " + max_items_per_trade + " items to your list.",
            type: "error"
        });
        return false;
    }
    if (text === 'Add to List') {
        $(btn).removeClass('btn-success').addClass('btn-info');
        $(btn).text('Remove from List');
        $(btn).closest('.item-icon').find('.item-price-input').attr('disabled', true);
    } else {
        $(btn).addClass('btn-success').removeClass('btn-info');
        $(btn).text('Add to List');
        $(btn).closest('.item-icon').find('.item-price-input').attr('disabled', false);
    }
    toggleItemInSaleBucket(item_id, price);
}

