window.o = {
    scene: null,
    camera: null,
    renderer: null,
    objects: {}
};

var runtime = function () {

    // ###### INIT ######
    window.o.scene = new THREE.Scene();
    createCamera();
    createRenderer();
    createLight();
    createFloor();

    // ###### SHOWTIME ######
    var cube = createBox();
    window.o.scene.add(cube);

    var line = createLine();
    window.o.scene.add(line);

    createBarGraph();

    function render() {
        requestAnimationFrame(render);

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;


        window.o.renderer.render(window.o.scene, window.o.camera);
    }
    render();
}

var createCamera = function () {
    window.o.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.o.camera.position.set(0, 10, 10);
    window.o.camera.lookAt(new THREE.Vector3(0, 0, 0));
}

var createRenderer = function () {
    window.o.renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    window.o.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(window.o.renderer.domElement);
    controls = new THREE.OrbitControls(window.o.camera, window.o.renderer.domElement);
}

var createFloor = function () {
    var geometry = new THREE.BoxGeometry(2000, 2000, 2000);
    var material = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        shininess: 20
    });
    material.side = THREE.BackSide

    floor = new THREE.Mesh(geometry, material);

    floor.position.set(0, 1000, 0);
    floor.rotation.x = THREE.Math.degToRad(-90);

    floor.receiveShadow = true;
    floor.castShadow = true;

    window.o.scene.add(floor);
}

var createSpotLight = function () {
    var ambient = new THREE.AmbientLight(0x999999);
    var spot = new THREE.SpotLight({
        color: 0xffffff,
        intensity: 0.1
    });

    spot.position.set(-50, 100, 100);
    spot.castShadow = true;
    spot.shadowDarkness = 0.2;

    window.o.scene.add(ambient, spot);
}

var createLight = function () {
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.bias = 0.01;

    directionalLight.position.set(-20, 30, 30);

    window.o.scene.add(directionalLight);
}

var createBox = function () {
    var geometry = new THREE.BoxGeometry(3, 3, 3);

    var material = new THREE.MeshPhongMaterial({
        color: 0x00ff00
    });

    var box = new THREE.Mesh(geometry, material);
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set(-15, 5, -10)

    return box;
}

var createBars = function (total, colour) {
    var box_width = 0.4,
        box_length = 2,
        box_margin = 0.8,
        box_dist = box_length + box_margin;

    var bars = new Array(),
        labels = new Array();

    var chart = new THREE.Object3D();
    var chart_bars = new THREE.Object3D();
    var chart_labels = new THREE.Object3D();
    chart.add(chart_bars);
    chart.add(chart_labels);
    chart.position.set(5, 0, 5);

    for (var i = 0; i < total; i += 1) {
        
        var geometry = new THREE.BoxGeometry(box_length, 1, box_width);
        geometry.translate( 0, 0.5, 0 );
        //geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 1, 0 ) );

        var material = new THREE.MeshPhongMaterial({
            color: colour,
            side: THREE.DoubleSide,
            shading: THREE.SmoothShading
        });

        id = new THREE.Mesh(geometry, material);

        id.position.x = i * box_dist;
        id.name = "bar-" + i;
        id.castShadow = true;
        id.receiveShadow = true;

        var label = createText("0.2");
        label.position.x = i * box_dist;
        label.position.y = 1.1;
        labels.push(label);
        //var pivot = new THREE.Object3D();
        //pivot.add(id);
        chart_bars.add(id);
        chart_labels.add(label);
        bars.push(id);
    }
    return {
        graph: chart,
        graph_bars: chart_bars,
        graph_labels: chart_labels,
        bars: bars,
        labels: labels
    };
}

var createBarGraph = function (conf, data) {
    conf = {
        range: [0, 100]
    };
    data = [{
            name: "A",
            val: 72
        },
        {
            name: "B",
            val: 31
        },
        {
            name: "C",
            val: 68
        },
        {
            name: "D",
            val: 40
        }
    ];
    var graph = createBars(data.length, 0xff0000);
    var _y = scale({
        domain: conf.range,
        range: [0, 1]
    });

    graph.graph_bars.scale.set(1, 6, 1);

    window.o.scene.add(graph.graph);
    window.o.objects.bar_chart = graph.bars;
    
    for (let d in data) {
        new TweenMax.to(graph.bars[d].scale, 1, {
            ease: Elastic.easeOut.config(1, 1),
            y: _y(data[d].val),
            delay: d * 0.25
        }, 1);
        graph.labels[d].position.y = getHeight(graph.bars[d])+1;
    }
}

var getHeight = function(mesh) {
    if( ! mesh.geometry.boundingBox ) mesh.geometry.computeBoundingBox();
    return mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y;
}

var createText = function (text) {
    
        var textGeometry = new THREE.TextGeometry( text, {
            font: window.o.font,
            size: 0.6,
            height: 0.01,
            curveSegments: 12
        });
        var textMaterial = new THREE.MeshPhongMaterial( 
            { color: 0xff0000, specular: 0xffffff }
        );
        var mesh = new THREE.Mesh( textGeometry, textMaterial );
        window.o.scene.add(mesh);
        return mesh;
}

var createLine = function () {
    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-10, 0, 0));
    geometry.vertices.push(new THREE.Vector3(0, 10, 0));
    geometry.vertices.push(new THREE.Vector3(10, 0, 0));

    return new THREE.Line(geometry, material);
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

var loader = new THREE.FontLoader();
loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
    window.o.font = font;
    runtime();
});