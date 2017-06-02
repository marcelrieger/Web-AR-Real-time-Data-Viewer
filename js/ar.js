function init() {
    showAssignmentPanelFlag = false;
    window.z = {
        scene: null,
        updateInterval: 1500,
        dataUpdater : null,
        font: null,
        markerCount: 6,
        data: {
            ready: false,
            sourceURL: null,
            data: null
        },
        marker_ready: false,
        markers: {},
        objects: []
    };
    updateDatasource();
}

var getJSON = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
        var status = xhr.status;
        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status);
        }
    };
    xhr.send();
};

var createBars = function (total, colour) {
    var box_width = 0.1,
        box_length = 0.5,
        box_margin = 0.1,
        box_dist = box_length + box_margin;

    var bars = new Array(),
        labels = new Array();

    var chart = new THREE.Object3D();
    var chart_bars = new THREE.Object3D();
    var chart_labels = new THREE.Object3D();
    chart.add(chart_bars);
    chart.add(chart_labels);
    chart.position.set(0, 0.8, 0);

    for (var i = 0; i < total; i += 1) {

        var geometry = new THREE.BoxGeometry(box_length, box_width, 1);
        geometry.translate(0, 0, 0.5);

        var material = new THREE.MeshPhongMaterial({
            color: colour,
            side: THREE.DoubleSide,
            shading: THREE.SmoothShading,
            opacity: 0.7,
            transparent: true
        });

        id = new THREE.Mesh(geometry, material);

        //geometry = new THREE.WireframeGeometry (geometry);
        //material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } )
        //id = new THREE.LineSegments(geometry, material);

        id.position.x = i * box_dist;
        id.name = "bar-" + i;
        id.castShadow = true;
        id.receiveShadow = true;

        var label = createText("loading", colour);
        label.position.x = i * box_dist;
        label.position.y = -1 * (box_width + 0.1);
        bars.push(id);
        labels.push(label);
        chart_bars.add(id);
        chart_labels.add(label);
    }
    chart.position.x -= ((total * (box_length + box_dist)) - box_dist) / 4;
    return {
        graph: chart,
        graph_bars: chart_bars,
        graph_labels: chart_labels,
        bars: bars,
        labels: labels,
        colour: colour,
        label_dist_x: box_dist,
        label_dist_y: -1 * (box_width + 0.1)
    };
}

var createBarGraph = function (properties, scene) {
    conf = {
        range: [0, 10]
    };
    var properties_length = properties.length;

    var graph = createBars(properties.length, 0xff8300);
    var _z = scale({
        domain: conf.range,
        range: [0, 1]
    });

    graph.graph_bars.scale.set(1, 1, 2);
    //graph.graph.scale.set(2,2,2);

    scene.add(graph.graph);
    window.z.objects.push({
        scene: scene,
        object: graph.graph
    });

    window.z.objects.bar_chart = graph.bars;

    for (var i = 0; i < properties_length; i++) {
        new TweenMax.to(graph.bars[i].scale, 1, {
            ease: Elastic.easeOut.config(1, 1),
            z: _z(0),
            delay: i * 0.25
        }, 1);
    }

    setInterval(function () {
        var sum = 0;
        for (var d = 0; d < properties_length; d++) {
            let name = properties[d];
            let val = window.z.data.data[name];
            new TweenMax.to(graph.bars[d].scale, 1, {
                ease: Elastic.easeOut.config(1, 1),
                z: _z(val)
            }, 1);
            graph.graph_labels.remove(graph.labels[d]);
            graph.labels[d] = undefined;
            graph.labels[d] = createText(name + ": " + val, graph.colour);
            graph.labels[d].position.y = graph.label_dist_y;
            graph.graph_labels.add(graph.labels[d]);
            var barWidth = getWidth(graph.bars[d]);
            var labelWidth = getWidth(graph.labels[d]);
            var width = (barWidth > labelWidth) ? barWidth : labelWidth;
            var offset = (labelWidth-barWidth)/2;
            if (d>0) {
                graph.bars[d].position.x = sum + offset;
                graph.labels[d].position.x = sum + offset;
            }
            sum += width + 0.09;
        }
    }, window.z.updateInterval);

    return graph;
}

var getHeight = function (mesh) {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    return mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z;
}

var getWidth = function (mesh) {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    return mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
}

var scale = function (opts) {
    var istart = opts.domain[0],
        istop = opts.domain[1],
        ostart = opts.range[0],
        ostop = opts.range[1];

    return function scale(value) {
        return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
    }
};

var createText = function (text, color) {
    var textGeometry = new THREE.TextGeometry(text, {
        font: window.z.font,
        size: 0.09,
        height: 0.001,
        curveSegments: 12
    });
    textGeometry.center();
    var textMaterial = new THREE.MeshPhongMaterial({
        color: color,
        specular: 0x000000
    });
    var mesh = new THREE.Mesh(textGeometry, textMaterial);
    //mesh.rotation.y = Math.PI;
    return mesh;
}

var createBox = function () {
    // The AR scene.
    //
    // The box object is going to be placed on top of the marker in the video.
    // I'm adding it to the markerRoot object and when the markerRoot moves,
    // the box and its children move with it.
    //
    var box = new THREE.Object3D();
    var boxWall = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.1, 1, 1, 1),
        new THREE.MeshLambertMaterial({
            color: 0xffffff
        })
    );
    boxWall.position.z = -0.5;
    box.add(boxWall);

    boxWall = boxWall.clone();
    boxWall.position.z = +0.5;
    box.add(boxWall);

    boxWall = boxWall.clone();
    boxWall.position.z = 0;
    boxWall.position.x = -0.5;
    boxWall.rotation.y = Math.PI / 2;
    box.add(boxWall);

    boxWall = boxWall.clone();
    boxWall.position.x = +0.5;
    box.add(boxWall);

    boxWall = boxWall.clone();
    boxWall.position.x = 0;
    boxWall.position.y = -0.5;
    boxWall.rotation.y = 0;
    boxWall.rotation.x = Math.PI / 2;
    box.add(boxWall);

    // Keep track of the box walls to test if the mouse clicks happen on top of them.
    var walls = box.children.slice();

    // Create a pivot for the lid of the box to make it rotate around its "hinge".
    var pivot = new THREE.Object3D();
    pivot.position.y = 0.5;
    pivot.position.x = 0.5;

    // The lid of the box is attached to the pivot and the pivot is attached to the box.
    boxWall = boxWall.clone();
    boxWall.position.y = 0;
    boxWall.position.x = -0.5;
    pivot.add(boxWall);
    box.add(pivot);

    walls.push(boxWall);

    box.position.z = 0.5;
    box.rotation.x = Math.PI / 2;

    box.open = false;

    box.tick = function () {
        // Animate the box lid to open rotation or closed rotation, depending on the value of the open variable.
        pivot.rotation.z += ((box.open ? -Math.PI / 1.5 : 0) - pivot.rotation.z) * 0.1;
    };

    return {
        box: box,
        walls: walls
    };
};

window.ARThreeOnLoad = function () {

    init();

    ARController.getUserMediaThreeScene({
        maxARVideoSize: 640,
        cameraParam: 'Data/camera_para-iPhone 5 rear 640x480 1.0m.dat',
        onSuccess: function (arScene, arController, arCamera) {
            (new THREE.FontLoader()).load('fonts/helvetiker_regular.typeface.json', function (font) {
                arController.setPatternDetectionMode(artoolkit.AR_MATRIX_CODE_DETECTION);
                arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_3x3);
                window.z.font = font;

                document.body.className = arController.orientation;

                var renderer = new THREE.WebGLRenderer({
                    antialias: true
                });
                if (arController.orientation === 'portrait') {
                    var w = (window.innerWidth / arController.videoHeight) * arController.videoWidth;
                    var h = window.innerWidth;
                    renderer.setSize(w, h);
                    renderer.domElement.style.paddingBottom = (w - h) + 'px';
                } else {
                    if (/Android|mobile|iPad|iPhone/i.test(navigator.userAgent)) {
                        renderer.setSize(window.innerWidth, (window.innerWidth / arController.videoWidth) * arController.videoHeight);
                    } else {
                        var w = (window.innerWidth / arController.videoHeight) * arController.videoWidth;
                        var h = window.innerHeight;
                        renderer.setSize(w, h);
                        document.body.className += ' desktop';
                    }
                }

                document.body.insertBefore(renderer.domElement, document.body.firstChild);

                for (var i = 1; i <= 6; i++) {
                    window.z.markers[i] = arController.createThreeBarcodeMarker(i);
                }
                window.z.marker_ready = true;

                window.z.scene = window.z.markers[1];

                var light = [
                    new THREE.PointLight(0xffffff),
                    new THREE.PointLight(0xffffff)
                ]
                light[0].position.set(30, 30, -10);
                arScene.scene.add(light[0]);
                light[1].position.set(-30, -30, -10);
                arScene.scene.add(light[1]);

                for (var i = 1; i <= 6; i++) {
                    arScene.scene.add(window.z.markers[i]);
                }

                var tick = function () {
                    arScene.process();
                    arScene.renderOn(renderer);
                    requestAnimationFrame(tick);
                };

                tick();
            });
        }
    });

    delete window.ARThreeOnLoad;
};

if (window.ARController && ARController.getUserMediaThreeScene) {
    ARThreeOnLoad();
}

function inDataSourceChanged() {
    var btn = document.getElementById("btnUpdateDataSource");
    btn.innerHTML = "update";
}

function updateDatasource() {
    clearInterval(window.z.dataUpdater);
    window.z.data.ready = false;
    var btn = document.getElementById("btnUpdateDataSource");
    btn.innerHTML = "waiting for data..";
    var datasourceid = document.getElementById("inDatasource").value;
    window.z.data.sourceURL = "https://dweet.io:443/get/latest/dweet/for/" + datasourceid;
    if (window.z.marker_ready) {
        for (var i = 0, len = window.z.objects.length; i < len; i++) {
            window.z.objects[i].scene.remove(window.z.objects[i].object);
        }
    }
    getJSON(window.z.data.sourceURL,
        function (err, data) {
            if (err || data.this != "succeeded") {
                console.info("Error fetching data from dweet.io", err);
                btn.innerHTML = "failed fetching data, click to retry";
                return;
            }
            window.z.data.ready = true;
            window.z.data.data = data.with[0].content;

            populateAssignmentTable();

            btn.innerHTML = "initializing 3d scene..";

            waitForScene(function () {
                btn.innerHTML = "ready";
                doAssignment();
            });

            window.z.dataUpdater = setInterval(function () {
                getJSON(window.z.data.sourceURL,
                    function (err, data) {
                        if (err || data.this != "succeeded") {
                            console.info("Error fetching data from dweet.io", err);
                            return;
                        }
                        window.z.data.data = data.with[0].content;
                    });
            }, window.z.updateInterval)
        });
}

function populateAssignmentTable() {
    var assTable = document.getElementById("assignmentTable");
    assTable.innerHTML = "";
    var tablehead = document.createElement('tr');
    var td1 = document.createElement('td');
    td1.innerHTML = "<strong>DATA</strong>";
    var td2 = document.createElement('td');
    td2.innerHTML = "<strong>MARKER</strong>";
    tablehead.appendChild(td1);
    tablehead.appendChild(td2);
    assTable.appendChild(tablehead);

    for (var k in window.z.data.data) {
        var tr = document.createElement('tr');
        var td = document.createElement("td");
        var tdselect = document.createElement("td");
        var selectElement = document.createElement('select');
        selectElement.setAttribute("id", "marker-"+k);
        for (var i = 1; i <= window.z.markerCount; i++) {
            var option = document.createElement('option');
            option.value = i;
            option.text = i;
            selectElement.appendChild(option);
        }
        tdselect.appendChild(selectElement);
        td.innerHTML = k;
        tr.appendChild(td);
        tr.appendChild(tdselect);
        assTable.appendChild(tr);
    }
}

function waitForScene(callback) {
    setTimeout(function () {
        if (window.z.marker_ready) {
            callback();
        } else {
            waitForScene(callback);
        }
    }, 500);
}

function videoSourceChange(data) {
    var videoSourceSelection = document.getElementById("camera-list");
    window.location = window.location.pathname + "?videosource=" + videoSourceSelection.options[videoSourceSelection.selectedIndex].value;
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

function showAssignmentPanel() {
    var assPanel = document.getElementById("assignmentPanel");
    if (showAssignmentPanelFlag) {
        assPanel.style.display = "none";
        doAssignment();
    } else {
        assPanel.style.bottom = document.getElementById("controlpanel").offsetHeight + 5;
        assPanel.style.display = "block";
    }
    showAssignmentPanelFlag = !showAssignmentPanelFlag;
}

function doAssignment() {
    for (var i = 0, len = window.z.objects.length; i < len; i++) {
        window.z.objects[i].scene.remove(window.z.objects[i].object);
    }
    var dataset = {};
    var dataset_key = [];
    for (var k in window.z.data.data) {
        var val = document.getElementById('marker-'+k);
        if (!dataset.hasOwnProperty(val.value)) {
            dataset[val.value] = [];
            dataset_key.push(val.value);
        }
        dataset[val.value].push(k);
    }
    for (var i = 0, len = dataset_key.length; i < len; i++) {
        createBarGraph(dataset[dataset_key[i]], window.z.markers[dataset_key[i]]);
    }

}