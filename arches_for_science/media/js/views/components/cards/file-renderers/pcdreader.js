import ko from 'knockout';
import pcdReaderTemplate from 'templates/views/components/cards/file-renderers/pcdreader.htm';
import {
    Color,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';
import { PCDLoader } from 'PCDLoader';
import { TrackballControls } from 'TrackballControls';
import 'bindings/threePCD';

export default ko.components.register('pcdreader', {
    viewModel: function(params) {
        this.params = params;
        this.displayContent = ko.unwrap(this.params.displayContent);
        this.fileType = '';
        this.url = "";
        this.type = "";
        this.renderers = [];
        this.loading = ko.observable(true);
        var self = this;
        var renderer;
        init();

        function init() {
            self.scene = new Scene();
            self.scene.background = new Color( 0x000000 );
            self.camera = new PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 0.01, 40 );
            self.camera.position.x = 0.4;
            self.camera.position.z = - 2;
            self.camera.up.set( 0, 0, 1 );
            self.scene.add( self.camera );
            renderer = new WebGLRenderer( { antialias: true } );
            renderer.setPixelRatio( window.devicePixelRatio );
            self.loader = new PCDLoader();
            self.controls = new TrackballControls( self.camera, renderer.domElement );
            self.controls.rotateSpeed = 2.0;
            self.controls.zoomSpeed = 0.3;
            self.controls.panSpeed = 0.2;
            self.controls.staticMoving = true;
            self.controls.minDistance = 0.3;
            self.controls.maxDistance = 0.3 * 100;
            self.renderers.push(renderer);
        }
    },
    template: pcdReaderTemplate
});