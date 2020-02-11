define(['jquery',
    'knockout',
    'three',
    'PCDLoader',
    'TrackballControls'
], function($, ko, THREE) {
    return ko.components.register('pcdreader', {
        viewModel: function(params) {
            this.params = params;
            this.fileType = '';
            this.url = "";
            this.type = "";
            var self = this;
            var camera, scene, renderer;
            var controls;
            var container;

            init();
            animate();
            function init() {

                scene = new THREE.Scene();
                scene.background = new THREE.Color( 0x000000 );

                camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 0.01, 40 );
                camera.position.x = 0.4;
                camera.position.z = - 2;
                camera.up.set( 0, 0, 1 );

                scene.add( camera );

                renderer = new THREE.WebGLRenderer( { antialias: true } );
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize( window.innerWidth, window.innerHeight );
                var loader = new THREE.PCDLoader();
                loader.load(self.params.displayContent.url, function( points ) {

                    scene.add( points );
                    var center = points.geometry.boundingSphere.center;
                    controls.target.set( center.x, center.y, center.z );
                    controls.update();

                } );
                container = window.document.getElementById( 'pcd-container' )
                container.appendChild( renderer.domElement );

                controls = new THREE.TrackballControls( camera, renderer.domElement );

                controls.rotateSpeed = 2.0;
                controls.zoomSpeed = 0.3;
                controls.panSpeed = 0.2;

                controls.staticMoving = true;

                controls.minDistance = 0.3;
                controls.maxDistance = 0.3 * 100;

                window.addEventListener( 'resize', onWindowResize, false );

            }

            function onWindowResize() {

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize( window.innerWidth, window.innerHeight );
                controls.handleResize();

            }

            function animate() {

                window.requestAnimationFrame( animate );
                controls.update();
                renderer.render( scene, camera );

            }

        },
        template: { require: 'text!templates/views/components/cards/file-renderers/pcdreader.htm' }
    });
});
