#include <File.au3>
#include <Array.au3>
#include <INet.au3>
#include <winhttp.au3>
#include <String.au3>
#include <IE.au3>
$hSession = _WinHttpOpen("Mozilla/5.0 (Windows NT 6.3; WOW64; rv:32.0) Gecko/20100101 Firefox/32.0")
$hConnect = _WinHttpConnect($hSession,"steamcommunity.com")
Local $profileIDs[1]
Local $profileWrongs[1]
$HTML = _WinHttpSimpleSSLRequest($hConnect, "GET", "id/doersf/friends/", "")
$lines = StringSplit($HTML,'friendBlock',1)
For $i = 1 to UBound($lines)-1 Step 1
	If StringInStr($lines[$i],'BitSkins #') > 0 Then
		$res = _StringBetween($lines[$i-1],'href="https://steamcommunity.com/','"></a>')
		if StringInStr($res[0],'id') Then
			_ArrayAdd($profileWrongs,$res[0])
		Else
			_ArrayAdd($profileIDs,$res[0])
		EndIf
		EndIf


Next
ClipPut(StringReplace(_ArrayToString($profileIDs),'|profiles/',','))
_ArrayDisplay($profileWrongs)
