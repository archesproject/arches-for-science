define([
    'underscore',
    'knockout',
    'viewmodels/base-import-view-model',
    'arches',
    'viewmodels/alert',
], function(_, ko, ImporterViewModel, arches, AlertViewModel) {
    return ko.components.register('json-importer', {
        viewModel: function(params) {
            const self = this;
            this.loadDetails = params.load_details || ko.observable();
            this.state = params.state;
            this.loading = params.loading || ko.observable();
            this.data2 = ko.observable(false);

            this.moduleId = params.etlmoduleid;
            ImporterViewModel.apply(this, arguments);
            
            // function getCookie(name) {
            //     if (!document.cookie) {
            //         return null;
            //     }
            //     const xsrfCookies = document.cookie.split(';')
            //         .map(c => c.trim())
            //         .filter(c => c.startsWith(name + '='));
                
            //     if (xsrfCookies.length === 0) {
            //         return null;
            //     }
            //     return decodeURIComponent(xsrfCookies[0].split('=')[1]);
            // }

            this.checkEndpoint = async function(){
                self.loading(true);
                const response = await self.submit('read');
                if (response.ok) {
                    const data = await response.json();
                    self.loading(false);
                    self.response(data);
                    self.loadDetails(data);
                } else {
                    // eslint-disable-next-line no-console
                    console.log('error');
                    self.loading(false);
                }
            };

            this.start = async function(){
                self.loading(true);
                const response = await self.submit('start');
                self.loading(false);
                params.activeTab("import");
                if (response.ok) {
                    const data = await response.json();
                    self.response(data); 
                    self.write();
                }
            };

            this.write = async function(){
                self.loading(true);
                const formData = new window.FormData();
                formData.append('load_details', JSON.stringify(self.loadDetails()));
                const response = await self.submit('write', formData);
                self.loading(false);
                if (response.ok) {
                    const data = await response.json();
                    self.response(data); 
                }
                else {
                    const data = await response.json();
                    this.alert(new AlertViewModel(
                        'ep-alert-red',
                        data["data"]["title"],
                        data["data"]["message"],
                        null,
                        function(){}
                    ));
                }
            };
        },
        template: { require: 'text!templates/views/components/etl_modules/json-importer.htm' }
    });
});
