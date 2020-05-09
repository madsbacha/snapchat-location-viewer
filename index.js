const mapEl = document.getElementById("map")
const fileEl = document.getElementById("jsonFile")
const importBtn = document.getElementById("import")
const locationsContainerEl = document.getElementById("location-selection")

const fourNumberReg = /[^0-9]*([0-9]+\.[0-9]+)[^0-9]*([0-9]+\.[0-9]+)[^0-9]*([0-9]+\.[0-9]+)[^0-9]*([0-9]+\.[0-9]+)[^0-9]*/

let currentLocation = false
let hasCenterLocation = false
let data = null
let activeLocations = {}
let hiddenLocTypes = [
    "Latest Location",
    "Areas you may have visited in the last two years",
    "Businesses you may have visited in the last two years",
    "Frequent Locations"
]
const typeToFunc = {
    "Home & Work": LocHomeAndWork,
    "Daily Top Locations": LocDailyTopLocs,
    "Locations You Have Visited": LocYouHaveVisited,
    "Top Locations Per Six-Day Period": LocTopLocPrSixDays
}
const map = L.map(mapEl, {
    trackResize: true
})

mapEl.style = `height:${window.innerHeight}px;position:relative;`;

window.addEventListener('resize', (event) => {
    mapEl.style = `height:${window.innerHeight}px;width:${window.innerWidth-300}px;position:relative;`;
})

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
const markerLayer = L.layerGroup().addTo(map)

importBtn.addEventListener('click', function(event) {
    event.preventDefault()

    const files = fileEl.files
    if (files.length <= 0) {
        alert("Please select a file.")
        return
    } else if (files.length > 1) {
        alert("Please only select a single file")
        return
    } else if (files[0].type !== "application/json") {
        alert("Please select a json file")
        return
    }

    const fileReader = new FileReader()
    fileReader.onload = function(e) {
        const result = JSON.parse(e.target.result);
        loadLocations(result)
    }

    fileReader.readAsText(files.item(0));
})

function loadLocations(json) {
    console.log("Result", json)
    data = json
    const locationTypes = Object.keys(json)
    locationTypes.forEach((locType, index) => {
        if (hiddenLocTypes.includes(locType))
            return;
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.id = `location${index}`
        checkbox.name = "locationTypes"
        checkbox.value = locType
        checkbox.classList.add("mr-2")
        checkbox.checked = true
        const label = document.createElement("label")
        label.htmlFor = `location${index}`
        label.innerText = locType
        const container = document.createElement("div")
        container.classList.add("py-1")
        container.appendChild(checkbox)
        container.appendChild(label)
        locationsContainerEl.appendChild(container)
        activeLocations[locType] = true
        checkbox.addEventListener('change', function(event) {
            activeLocations[locType] = event.target.checked
            updateLocations()
        })
    })
    updateLocations()
}

navigator.geolocation.getCurrentPosition((geoloc) => {
    const currentLoc = L.latLng(geoloc.coords.latitude, geoloc.coords.longitude)
    map.setView(currentLoc, 14)
    addMarker(currentLoc, "Current location")
    hasCenterLocation = true
    currentLocation = currentLoc
}, () => {
    hasCenterLocation = false
})

function updateLocations() {
    markerLayer.clearLayers()
    const activeLocTypes = Object.keys(activeLocations).filter(loc => activeLocations[loc] === true)

    activeLocTypes.forEach(locType => {
        if (typeToFunc[locType])
            typeToFunc[locType](data[locType])
    })

    addMarker(currentLocation, "Current location")
}

function LocHomeAndWork(data) {
    console.log("homework data", data)
    const [home, homeLat, homeLatPrecision, homeLong, homeLongPrecision] = fourNumberReg.exec(data.Home)
    const [work, workLat, workLatPrecision, workLong, workLongPrecision] = fourNumberReg.exec(data.Work)

    if(!hasCenterLocation) {
        const homeLoc = L.latLng(homeLat, homeLong)
        map.setView(homeLoc, 14)
        hasCenterLocation = true
    }

    addMarker([homeLat, homeLong], "Home")
    addMarker([workLat, workLong], "Work")
}

function addMarker(loc, tooltip) {
    const homeMarker = L.marker(loc);
    homeMarker.bindTooltip(tooltip).openTooltip()
    homeMarker.addTo(markerLayer)
}


function LocDailyTopLocs(data) {
    data.forEach(locations => {
        locations.forEach(locObj => {
            const day = Object.keys(locObj)[0]
            const locText = locObj[day]
            const [loc, locLat, locLatPrecision, locLong, locLongPrecision] = fourNumberReg.exec(locText)
            addMarker([locLat, locLong], `<b>Daily Top Location</b><br>${day}`)
        })
    })
}

function LocYouHaveVisited(data) {
    data.forEach(locObj => {
        const [loc, locLat, locLatPrecision, locLong, locLongPrecision] = fourNumberReg.exec(locObj["Latitude, Longitude"])
        addMarker([locLat, locLong], `<b>Locations You Have Visited</b><br>${locObj["Time"]}`)
    })
}

function LocTopLocPrSixDays(data) {
    data.forEach(locations => {
        locations.forEach(locObj => {
            const day = Object.keys(locObj)[0]
            const locText = locObj[day]
            const [loc, locLat, locLatPrecision, locLong, locLongPrecision] = fourNumberReg.exec(locText)
            addMarker([locLat, locLong], `<b>Top Locations Per Six-Day Period</b><br>${day}`)
        })
    })
}
