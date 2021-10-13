//default location in case location is denied
const London = {latitude: 52, longitude: -0.09};
var currencies = {};
var border = {};
var cityMarkers = {};
var webcamsMarkers = {};
var cityIcon = L.icon({
    iconUrl: 'img/location.png',

    iconSize: [38, 38], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor: [22, 50], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var cameraIcon = L.icon({
    iconUrl: 'img/camera.png',

    iconSize: [38, 38], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor: [22, 50], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});


//create map
var myMap = initializeMap();
//need to be initialized only once
fillCountries();
addEasyButtons();
populateCurrencies();


//getting user location
myMap.locate().on("locationfound", (e) => {
    changeOptions(e);
    changeData(e);
}).on("locationerror", () => {
    $("#selectOption").val('GB').change();
    changeData(London);
});

//Listeners
$("#selectOption").on("change", changeData);
$("#fromCurrency").on("change", updateConversion);
$("#toCurrency").on("change", updateConversion);
$("#exchangeInput").on("change", updateConversion);


async function changeData() {
    //preloader
    $('#preloader').fadeIn('fast');

    //update map with new info
    updateCoordinatesForWheather();
    drawBorder();
    populateInfoModal();
    getCitiesByCountry();
    getWebcamsFromAPI();

    $('#preloader').fadeOut('slow');

}

function changeOptions(coords) {
    //change select Option to users location:
    $.ajax({
        url: "libs/php/getCountryCode.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: coords.latitude,
            lng: coords.longitude
        },
        success: function (result) {

            // console.log(result);

            if (result.status.name == "ok") {
                $("#selectOption").val(result['data']['countryCode']).change();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.warn(jqXHR.responseText + "   " + errorThrown);
        }
    });
}

function drawBorder() {
    //draw border
    $.ajax({
        url: "libs/php/countryBorders.php",
        type: "POST",
        dataType: "json",
        data: {
            code: $("#selectOption option:selected").val(),
        },

        success: function (result) {

            // console.log(result);

            if (result.status.name == "ok") {
                var bounds = result.data;
                var borderStyle = {
                    color: "#FF0000",
                    weight: 3,
                    opacity: 0.7,
                    fillOpacity: 0.0
                };
                if (myMap.hasLayer(border)) {
                    myMap.removeLayer(border);
                }

                border = L.geoJSON(bounds, borderStyle).addTo(myMap);
                myMap.fitBounds(border.getBounds(), {
                    padding: [10, 10],
                    animate: true,
                    duration: 5,
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // console.warn(errorThrown);
        }
    });
}

function fillCountries() {
    // fill countries
    $.ajax({
        url: "libs/php/countryNames.php",
        type: 'GET',
        dataType: 'json',

        success: function (result) {

            //console.log(result);

            if (result.status.name == "ok") {
                for (var i = 0; i < result.data.length; i++) {
                    $('#selectOption').append("<option value=" + result['data'][i]['code'] + ">" + result['data'][i]['name'] + "</option>");
                }
            }

        },
    });
}

function initializeMap() {
    let myMap = L.map('mapId').setView([51.505, -0.09], 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(myMap);
    return myMap;


}

function addEasyButtons() {
    //Info-button
    infoButton = L.easyButton({
        id: 'infoLeaf',
        position: 'topleft',
        type: 'animate',
        leafletClasses: true,
        states: [{
            stateName: 'show-info',
            onClick: function (button, map) {
                $("#infoModalScrollable").modal('show');
            },
            title: 'show country information',
            icon: "fa-info"
        }]
    })

    //Exchange-button
    exchangeButton = L.easyButton({
        id: 'exchangeLeaf',
        position: 'topleft',
        type: 'animate',
        leafletClasses: true,
        states: [{
            stateName: 'show-exchange',
            onClick: function (button, map) {
                $("#exchangeModalScrollable").modal('show');
            },
            title: 'show exchange rates',
            icon: "fas fa-pound-sign"
        }]
    });

    // Weather-button
    weatherButton = L.easyButton({
        id: 'weatherLeaf',
        position: 'topleft',
        type: 'animate',
        leafletClasses: true,
        states: [{
            stateName: 'show-weather',
            onClick: function (button, map) {
                $("#weatherModalScrollable").modal("show");
            },
            title: 'show the weather',
            icon: "fas fa-sun"
        }]
    })
    myMap.addControl(infoButton);
    myMap.addControl(weatherButton);
    myMap.addControl(exchangeButton);
}

function populateWheather(coords) {
    //Weather:
    $.ajax({
        url: "libs/php/openWeather.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: coords.latitude,
            lon: coords.longitude
        },
        success: function (result) {
            //console.log(result);
            temp = result['data'];

            if (result.status.name == "ok") {
                //today
                $('#todayWeatherDesc').empty();
                $('#todayWeatherDesc').html(temp.daily[0].weather[0].description);


                //rest of them
                for (let i = 0; i < temp.daily.length; i++) {

                    //date
                    $('#weatherDay' + i).empty();
                    $('#weatherDay' + i).html(new Date(temp.daily[i].dt * 1000).toDateString().slice(0, 10));

                    //img
                    $('#weatherImg' + i).empty();
                    $('#weatherImg' + i).attr('src', ("https://openweathermap.org/img/wn/" + temp.daily[i].weather[0].icon + "@2x.png"));

                    //max-temp
                    $('#weatherMaxTempDay' + i).empty();
                    $('#weatherMaxTempDay' + i).html(temp.daily[i].temp.max.toFixed(0) + '℃');

                    //min-temp
                    $('#weatherMinTempDay' + i).empty();
                    $('#weatherMinTempDay' + i).html(temp.daily[i].temp.min.toFixed(0) + '℃');
                }

            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //alert(jqXHR + " There has been an error! in wheather call" + errorThrown)
        }
    });

}

function populateInfoModal() {
    $.ajax({
        url: "libs/php/getCountryInfo.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectOption').val(),
        },
        success: function (result) {

            // console.log(result);

            if (result.status.name == "ok") {
                $("#countryName").html(result['data'][0]['countryName']);
                $('#capital').html(result['data'][0]['capital']);
                $('#area').html(Number(result['data'][0]['areaInSqKm']).toLocaleString() + " km<sup>2</sup>");
                $('#population').html(Number(result['data'][0]['population']).toLocaleString());
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            // your error code
            //console.log(textStatus)
        }
    });


    getCountryFlag();
    getCountryWiki();


}

function getWindDirection(degrees) {
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[Math.ceil(degrees % 16)];
}

function getCountryFlag() {
    $.ajax({
        url: "libs/php/restCountry.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectOption').val(),
        },
        success: function (result) {

            //console.log(result);


            if (result.status.name == "ok") {
                $("#flag").attr("src", result['data']['flag']);
                $('#currency').html(result['data']['currencies']['0']['name'] + " - " + result['data']['currencies']['0']['symbol']);
                $('#continent').html(result['data']['region']);
                $('#language').html(result['data']['languages']['0']['name']);
                $('#fromCurrency').val(result['data']['currencies'][0]['code']).change();

            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //alert("There has been an error!")
        }
    });
}

function getCountryWiki() {

    $.ajax({
        url: "libs/php/wikiApi.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectOption option:selected').text(),
        },
        success: function (result) {
            //console.log(result);
            let url = 'https://' + result['data']['0']['wikipediaUrl'];

            if (result.status.name == "ok") {
                $("#sumTitle").empty();
                $("#sumTitle").append(result['data']['0']['title']);
                $("#summary").html(result['data']['0']['summary']);
                $("#wikipediaUrl").html(result['data']['0']['wikipediaUrl']);
                $("#wikipediaUrl").attr("href", url);
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            // your error code
        }
    });
}

function updateCoordinatesForWheather() {
    $.ajax({
        url: "libs/php/openCage.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectOption').val(),
        },
        success: function (result) {
            // console.log(result);
            let coords = {};
            coords.latitude = result['results'][0]['geometry']['lat'];
            coords.longitude = result['results'][0]['geometry']['lng'];
            populateWheather(coords);

        },
        error: function (jqXHR, textStatus, errorThrown) {
            // your error code
            //console.log(errorThrown);
            //console.log(textStatus)


        }
    });

}

function populateCurrencies() {
//Populate currencies

    $.ajax({
        url: "libs/php/openExchangeRates.php",
        type: 'GET',
        dataType: 'json',


        success: function (result) {

            // console.log(result);

            if (result.status.name === 'ok') {
                //add currencies to options
                currenciesKeys = Object.keys(result['data']['rates']);
                currencies = result['data']['rates'];
                $('#select').empty();
                for (let i = 0; i < currenciesKeys.length; i++) {
                    $('#fromCurrency').append('<option value="' + currenciesKeys[i] + '">' + currenciesKeys[i] + '</option>');
                    $('#toCurrency').append('<option value="' + currenciesKeys[i] + '">' + currenciesKeys[i] + '</option>');
                    $("#exchangeDate").html(new Date(result['data']['date']).toISOString().slice(0, 10));
                }
                $('#toCurrency').val('USD').change();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // your error code
            //console.log(textStatus)
        }
    });

}

function updateConversion() {
    let to = $("#toCurrency option:selected").val();
    let from = $("#fromCurrency option:selected").val();
    let value = parseInt($("#exchangeInput").val());

    if (from === to)
        $("#exchangeResult").html(value);
    else
        $("#exchangeResult").html((value * (parseFloat(currencies[to]) / parseFloat(currencies[from]))).toFixed(2));

}

function getCitiesByCountry() {
    $.ajax({
        url: "libs/php/getCityByCountry.php",
        type: 'GET',
        dataType: 'json',
        data: {
            code: $("#selectOption option:selected").val(),
        },

        success: function (result) {

            // console.log(result);
            addMarkersToMap(result['data']);


        },
        error: function (jqXHR, textStatus, errorThrown) {
            // your error code
            console.log(textStatus)
        }
    });

}

function addMarkersToMap(cities) {

    if (myMap.hasLayer(cityMarkers)) {
        myMap.removeLayer(cityMarkers);
    }

    cityMarkers = L.markerClusterGroup();
    cities.forEach(city => {
        let marker = L.marker(new L.LatLng(city['lat'], city['lng']), {icon: cityIcon});
        marker.bindPopup('<h3><strong>' + city['city'] + '</strong></h3>\n <h4>Population: ' + city['population'].toLocaleString() + '</h4>');
        cityMarkers.addLayer(marker);
    });
    myMap.addLayer(cityMarkers);

}

function getWebcamsFromAPI() {
    $.ajax({
        url: "libs/php/getWebcamsByCountry.php",
        type: 'GET',
        dataType: 'json',
        data: {
            code: $("#selectOption option:selected").val(),
        },

        success: function (result) {

            //console.log(result);


            let webcams = result.data;


            if (myMap.hasLayer(webcamsMarkers)) {
                myMap.removeLayer(webcamsMarkers);
            }

            webcamsMarkers = L.markerClusterGroup();
            webcams.result.webcams.forEach(webcam => {
                let marker = L.marker(new L.LatLng(webcam.location.latitude, webcam.location.longitude), {icon: cameraIcon});
                if (webcam.player.lifetime.available) {
                    marker.bindPopup('<h3><strong>' + webcam.title + '</strong></h3>\n <iframe allowfullscreen  src="' + webcam.player.lifetime.embed + '">' + webcam.player.lifetime.embed + '</iframe>');
                    webcamsMarkers.addLayer(marker);
                }
            });
            myMap.addLayer(webcamsMarkers);


        },
        error: function (jqXHR, textStatus, errorThrown) {
            // your error code
            console.log(textStatus)
        }
    });

}



