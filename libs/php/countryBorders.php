<?php


// remove for production

ini_set('display_errors', 'On');
error_reporting(E_ALL);


    $executionStartTime = microtime(true);

    $countryData = json_decode(file_get_contents("countryBorders.geo.json"), true);

    $countryCode = $_REQUEST['code'];

    $border = [];

    foreach ($countryData['features'] as $feature) {

        if($countryCode == $feature["properties"]['iso_a2']){
            $border = $feature;
        }   
    }

    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['status']['executedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data'] = $border;
    
    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);

?>
