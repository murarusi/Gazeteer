<?php


// remove for production

ini_set('display_errors', 'On');
error_reporting(E_ALL);


$executionStartTime = microtime(true);

$cities = json_decode(file_get_contents("cities.json"), true);

$countryCode = $_REQUEST['code'];

$result = array();

foreach ($cities as $city) {

    if($countryCode == $city["iso2"] && $city['population'] > 100000){
       array_push($result, $city);
    }
}

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['executedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $result;

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);

?>