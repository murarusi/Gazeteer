<?php


// remove for production

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);


$key = "e654ff78558d4551a102f5b62d71213f";

$url = "https://api.opencagedata.com/geocode/v1/json?q=". $_REQUEST['country'] ."&key=" . $key;

//CURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

curl_close($ch);

echo $result;
