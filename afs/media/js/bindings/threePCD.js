define([
    'jquery',
    'knockout'
], function($, ko) {
    ko.bindingHandlers.threePCD = {
        init: function(element, valueAccessor) {
            var config = ko.unwrap(valueAccessor());
            var animationFrame;
            config.renderers.forEach(function(renderer){
                element.append( renderer.domElement );
            });
            
            loadFile(config.displayContent.url);

            window.addEventListener( 'resize', onWindowResize, false );
            
            function onWindowResize() {
                config.camera.aspect = window.innerWidth / window.innerHeight;
                config.camera.updateProjectionMatrix();
                config.renderers.forEach(function(renderer){
                    renderer.setSize( window.innerWidth, window.innerHeight );
                });
                config.controls.handleResize();
            }

            function animate() {
                animationFrame = window.requestAnimationFrame( animate );
                config.controls.handleResize();
                config.controls.update();
                render();
            }
    
            function render() {      
                config.renderers.forEach(function(renderer){
                    renderer.render( config.scene, config.camera );
                });
            }

            function loadFile(url) {
                config.loader.load(url, function( points ) {
                    points.material.color.set(0xff1199);
                    config.scene.add( points );
                    var center = points.geometry.boundingSphere.center;
                    config.controls.target.set( center.x, center.y, center.z );
                    config.controls.handleResize();
                    config.controls.update();
                    animate();
                    config.loading(false);
                } );
            }

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                window.cancelAnimationFrame(animationFrame);
            }); 
        }

    };

    return ko.bindingHandlers.threePCD;
});
