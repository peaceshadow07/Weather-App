
const WEATHER = ["https://images.unsplash.com/photo-1518873890627-d4b177c06e51?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
                  "https://images.unsplash.com/photo-1494280986787-c49b328829dd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
                  "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
                ]
const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const AQI_OF_DAY = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
let selectedCityText;
let selectedCity;


const getAQI = async ({lat,lon})=>{
    const AQIResponse = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${APIKey}`);
    return AQIResponse.json();
};


const getCurrentWeather = async ({lat, lon, name : city}) =>{

    const url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}&units=metric`:`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKey}&units=metric`;
    const response  = await fetch(url);
    return response.json();
};

const getHourlyForecast = async({name: city}) =>{
    const response  = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${APIKey}&units=metric`);
    const hourlyResponse = await response.json();

    return hourlyResponse.list.map( data => {
        const {main : {temp, temp_min, temp_max}, dt, dt_txt, weather:[{description, icon}]} = data;
        return {dt, dt_txt, temp, temp_min, temp_max, description, icon};
    });


};

const getCities = async (cityName)=>{
     const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${APIKey}`);
     return response.json();
};


const formatTemp = (temp) => `${temp?.toFixed(1)}°`;
const iconUrl = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`;
const getTime = (dt_txt) => dt_txt.split(" ")[1];

//Loads data for current weather

const loadCurrentWeather = ({name, main : {temp, temp_min, temp_max}, weather:[{description}]})=>{
    let currentForecast = document.querySelector("#current-weather");
    currentForecast.querySelector(".city").textContent = name;
    currentForecast.querySelector(".temp").textContent = formatTemp(temp);
    currentForecast.querySelector(".description").textContent = description;
    currentForecast.querySelector(".min-max-temp").textContent = `H:${formatTemp(temp_max)} L: ${formatTemp(temp_min)}`;
    let body = document.getElementsByTagName("body")[0];
    let weather = temp < 10 ? WEATHER[0] : temp < 25 ? WEATHER[1] : WEATHER[2];
    body.style.backgroundImage = `url(${weather})`;
};
//  Loads Air Quality Index
const loadAirQualityIndex = ({AQI,pm2_5, pm10})=>{
    let airQuality = document.querySelector(".aqi-container");
    airQuality.querySelector(".aqi").textContent = AQI_OF_DAY[AQI-1];
    airQuality.querySelector(".pm2_5").textContent = `PM 2.5 : ${pm2_5}`;
    airQuality.querySelector(".pm10").textContent = `PM 10 : ${pm10}`;

};

// Loads the data for hourly forecast

const loadHourlyForecast = ({main:{temp: tempNow}, weather:[{icon:iconNow}]},forecastData) => {
    let hourlyForecast = document.querySelector('.hourly-container');
    let newInnerHTML = "";
    const timeFormatter = Intl.DateTimeFormat("en",{
        hour12:true,
        hour:'numeric'
    });
    newInnerHTML += `<div>
    <p class = "time">Now</p>
    <img class="icon" src="${iconUrl(iconNow)}">
    <p class = "hourly-temp">${formatTemp(tempNow)}</p>
</div>`;

    let oneDayData = forecastData.slice(2,13);

    for( {temp, icon, dt_txt} of oneDayData){
        newInnerHTML += `<div>
                        <p class = "time">${timeFormatter.format(new Date(dt_txt))}</p>
                        <img class="icon" src="${iconUrl(icon)}">
                        <p class = "hourly-temp">${formatTemp(temp)}</p>
                    </div>`;
    }

    hourlyForecast.innerHTML = newInnerHTML;
};

// Load five day forecast

const calculateDayWiseForecast = (hourlyForecastData) => {
    let dayWiseForecastMap = new Map();
    for(let forecast of hourlyForecastData){
        const [date] = forecast.dt_txt.split(" ");
        const dayOfWeek = DAYS_OF_WEEK[new Date(date).getDay()];

        if(dayWiseForecastMap.has(dayOfWeek)){
            let forecasts = dayWiseForecastMap.get(dayOfWeek);
            forecasts.push(forecast);
            dayWiseForecastMap.set(dayOfWeek, forecasts);
        }else{
            dayWiseForecastMap.set(dayOfWeek,[forecast]);
        }
    }

    for(let [key, value] of dayWiseForecastMap){
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.max(...Array.from(value, val => val.temp_max));

        dayWiseForecastMap.set(key, {temp_min, temp_max, icon : value.find(v => v.icon).icon})
    }
    return dayWiseForecastMap;

};


const loadFiveDayForecast = (hourlyForecastData) =>{
    const dayWiseForecastMap = calculateDayWiseForecast(hourlyForecastData);
    const container = document.querySelector(".five-day-forecast-container");
    let dayWiseInfo = "";

    Array.from(dayWiseForecastMap).map(([day,{temp_min,temp_max,icon}],index)=>{
        if(index < 5)
        dayWiseInfo += `<div class="day-wise-forecast">
                        <h3 class="day">${index == 0 ? "today" : day}</h3>
                        <img class="icon" src="${iconUrl(icon)}" alt="">
                        <p class="min-temp">${formatTemp(temp_min)}</p>
                        <p class="max-temp">${formatTemp(temp_max)}</p>
                    </div>`;
    });

    container.innerHTML = dayWiseInfo;
};


//Load the feels like data

const loadFeelsLike = ({main : {feels_like}})=>{
    let feelsLikeDiv = document.querySelector("#feels-like");
    feelsLikeDiv.querySelector(".feels-like-temp").textContent = formatTemp(feels_like);
}

//Load the humidity data

const loadHumidity = ({main : {humidity}})=>{
    let humidityDiv = document.querySelector("#humidity");
    humidityDiv.querySelector(".humidity-value").textContent = humidity+'%';
}


// On change in search input
const onSearchChange = async (event)=>{
 const cityName = event.target.value;
 const listOfCities = await getCities(cityName);
if(!cityName){
    selectedCity = null;
    selectedCityText = "";
}
    if(cityName && cityName !== selectedCityText ){
            let options = "";
            for(let {lat,lon, name, state, country} of listOfCities){
                options += `<option data-city-details='${JSON.stringify({lat, lon, name})}' value="${name} , ${state}, ${country}"></option>`;
            }
            document.querySelector("#cities").innerHTML = options;
    }

};




function debounce(func){
    let timer;
    return (...args)=>{
       clearTimeout(timer);
       timer = setTimeout(()=>{
        func.apply(this,args)
       },500);
    }
}

const loadData = async()=>{
    const currentWeatherData = await getCurrentWeather(selectedCity);
    loadCurrentWeather(currentWeatherData);
    const AQIResponse = await getAQI(selectedCity);
    const {list:[{main:{aqi : AQI},components:{pm2_5, pm10}}]} = AQIResponse;
    loadAirQualityIndex({AQI, pm2_5, pm10});
    const hourlyForecastData = await getHourlyForecast(currentWeatherData);
    loadHourlyForecast(currentWeatherData,hourlyForecastData);
    loadFiveDayForecast(hourlyForecastData);
    loadFeelsLike(currentWeatherData);
    loadHumidity(currentWeatherData);
};

const debounceSearch = debounce((event) => onSearchChange(event));

const handleCitySelection = (event)=>{
    selectedCityText = event.target.value;
    let options = document.querySelectorAll("#cities > option");

    if(options?.length){
        let selectedOption = Array.from(options).find( option => option.value === selectedCityText);
        selectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"));
        loadData();
    }
};

const loadForecastUsingGeoLocation = ()=>{
    navigator.geolocation.getCurrentPosition(({coords})=>{
        const {latitude:lat, longitude:lon} = coords;
        selectedCity = {lat, lon};
        loadData();
    }, error=>console.log(error))
};


// on load of DOM content load all the data 
document.addEventListener("DOMContentLoaded",async ()=>{
    loadForecastUsingGeoLocation();
    const searchInput = document.querySelector("#search");
    searchInput.addEventListener("input", debounceSearch);
    searchInput.addEventListener("change", handleCitySelection);
    
});