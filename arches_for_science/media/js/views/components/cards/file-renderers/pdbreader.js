import ko from 'knockout';
import pdbReaderTemplate from 'templates/views/components/cards/file-renderers/pdbreader.htm';
import {
    Color,
    DirectionalLight,
    Group,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three';
import { PDBLoader } from 'PDBLoader';
import { CSS2DRenderer } from 'CSS2DRenderer';
import { TrackballControls } from 'TrackballControls';
import 'bindings/threePDB';

export default ko.components.register('pdbreader', {
    viewModel: function(params) {
        this.params = params;
        this.displayContent = ko.unwrap(this.params.displayContent);
        this.fileType = '';
        this.url = "";
        this.type = "";
        this.loading = ko.observable(true);
        var self = this;
        this.loader = new PDBLoader();
        self.offset = new Vector3();
        init();
        var renderer;
        var labelRenderer;

        function init() {
            self.renderers = [];
            self.scene = new Scene();
            self.params.state.scene = self.scene;
            self.scene.background = new Color( 0x000000 );
            self.camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
            self.camera.position.z = 1000;
            self.scene.add( self.camera );
            self.light = new DirectionalLight( 0xffffff, 0.8 );
            self.light.position.set( 1, 1, 1 );
            self.scene.add( self.light );
            self.light2 = new DirectionalLight( 0xffffff, 0.5 );
            self.light2.position.set( - 1, - 1, 1 );
            self.scene.add( self.light2 );
            self.root = new Group();
            self.scene.add( self.root );
            renderer = new WebGLRenderer( { antialias: true } );
            renderer.setPixelRatio( window.devicePixelRatio );
            labelRenderer = new CSS2DRenderer();
            labelRenderer.domElement.style.position = 'absolute';
            labelRenderer.domElement.style.top = '0';
            labelRenderer.domElement.style.pointerEvents = 'none';
            self.controls = new TrackballControls( self.camera, renderer.domElement );
            self.controls.minDistance = 500;
            self.controls.maxDistance = 2000;
            self.renderers.push(renderer);
            self.renderers.push(labelRenderer);
        }

    },
    template: pdbReaderTemplate
});
