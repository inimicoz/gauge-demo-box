(function() {
    let shadowRoot;

    var Ar = [];
    var ArChartGauge = [];

    let template = document.createElement("template");
    template.innerHTML = `
		<style type="text/css">	
		body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		}
		</style>       
	`;

	//https://apis.google.com/js/api.js
    const googlesheetsjs = "https://dbuitend.github.io/SAC/sacgooglesheetstock/box/api.js";
    //https://www.amcharts.com/lib/4/core.js
    const amchartscorejs = "https://dbuitend.github.io/SAC/sacgooglesheetstock/box/core.js";
    //https://www.amcharts.com/lib/4/charts.js
    const amchartschartsjs = "https://dbuitend.github.io/SAC/sacgooglesheetstock/box/charts.js";
    //https://www.amcharts.com/lib/4/themes/animated.js
    const amchartsanimatedjs = "https://dbuitend.github.io/SAC/sacgooglesheetstock/box/animated.js";

	function loadScript(src) {
	  return new Promise(function(resolve, reject) {
		let script = document.createElement('script');
		script.src = src;

		script.onload = () => {console.log("Load: " + src); resolve(script);}
		script.onerror = () => reject(new Error(`Script load error for ${src}`));

		shadowRoot.appendChild(script)
	  });
	}

    // Create the chart
    function Amchart(id, divid, value, title, firsttime) {

        var data = {};
        if (value !== "") {
            data = JSON.parse(value);
            console.log(data);
        }


        if(firsttime === 0) {
			// Themes begin
			am4core.useTheme(am4themes_animated);
			// Themes end

			// Create chart instance
			var chart = am4core.create(divid, am4charts.XYChart);

			// Add data
			chart.data = data;

			// Set input format for the dates
			chart.dateFormatter.inputDateFormat = "dd-MM-yyyy";

			// Create axes
			var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
			dateAxis.renderer.grid.template.location = 0;
			dateAxis.renderer.minGridDistance = 50;

			var idx1 = title.indexOf('"');
			var idx2 = title.indexOf(',');
			var str_fin = title.substring(idx1, idx2);

			dateAxis.title.text = str_fin;
			dateAxis.title.fontWeight = "bold";

			var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

			// Create series
			var series = chart.series.push(new am4charts.LineSeries());
			series.dataFields.valueY = "value";
			series.dataFields.dateX = "date";
			series.strokeWidth = 3;
			series.fillOpacity = 0.5;

			// Add vertical scrollbar
			chart.scrollbarY = new am4core.Scrollbar();
			chart.scrollbarY.marginLeft = 0;

			// Add cursor
			chart.cursor = new am4charts.XYCursor();
			chart.cursor.behavior = "zoomY";
			chart.cursor.lineX.disabled = true;

			ArChartGauge.push({
				'id': id,
				'chart': chart
			});
		} else {            	
            	var foundIndex = Ar.findIndex(x => x.id == id);
    			console.log("foundIndex drawChart: " + foundIndex);
    			ArChartGauge[foundIndex].chart.data = data;
            }

    };

    // Google Sheets
    function GoogleSheets(divid, text_val, formula_val, id, firsttime) {

        /**
        *  Initializes the API client library and sets up sign-in state
        *  listeners.
        */
        function initClient() {
            var API_KEY = 'AIzaSyA51UI70Z_M-hUMGWzfT-Sk91rGnIZqH70'; // TODO: Update placeholder with desired API key.
            var CLIENT_ID = '715194088226-reqbviv94bng5kcnvg055e7kbivjhofr.apps.googleusercontent.com'; // TODO: Update placeholder with desired client ID.

            // TODO: Authorize using one of the following scopes:
            //   'https://www.googleapis.com/auth/drive'
            //   'https://www.googleapis.com/auth/drive.file'
            //   'https://www.googleapis.com/auth/spreadsheets'
            var SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

            gapi.client.init({
                'apiKey': API_KEY,
                'clientId': CLIENT_ID,
                'scope': SCOPE,
                'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            }).then(function() {
                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
                // Handle the initial sign-in state.
                updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            });
        }


        function makeApiCall_Get() {
            var params = {
                // The ID of the spreadsheet to retrieve data from.
                spreadsheetId: '17Z5sAfhIOFhWviRReffBPIjq3Wo4ggJDcjKl9y17R48', // TODO: Update placeholder value.

                // The A1 notation of the values to retrieve.
                range: 'Data!B:C', // TODO: Update placeholder value.

                // How values should be represented in the output.
                // The default render option is ValueRenderOption.FORMATTED_VALUE.
                valueRenderOption: 'FORMATTED_VALUE', // TODO: Update placeholder value.

                // How dates, times, and durations should be represented in the output.
                // This is ignored if value_render_option is
                // FORMATTED_VALUE.
                // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
                dateTimeRenderOption: 'FORMATTED_STRING', // TODO: Update placeholder value.
            };

            var request = gapi.client.sheets.spreadsheets.values.get(params);
            request.then(function(response) {
                // TODO: Change code below to process the `response` object:
                console.log(response.result.values);

				if (typeof response.result.values !== 'undefined') {
					var arraydata = [];
					if (response.result.values.length > 0) {
						for (i = 1; i < response.result.values.length; i++) {
							//console.log(response.result.values[i]);
							arraydata.push({
								"date": response.result.values[i][0],
								"value": response.result.values[i][1]
							});
						}
					}
					console.log(arraydata);
					Amchart(id, divid, JSON.stringify(arraydata), formula_val, firsttime);
				}

            }, function(reason) {
                console.error('error: ' + reason.result.error.message);
            });
        }

        function makeApiCall_BatchUpdate() {
            var params = {
                // The ID of the spreadsheet to update.
                spreadsheetId: '17Z5sAfhIOFhWviRReffBPIjq3Wo4ggJDcjKl9y17R48', // TODO: Update placeholder value.
            };

            var batchUpdateValuesRequestBody = {
                // How the input data should be interpreted.
                valueInputOption: 'USER_ENTERED', // TODO: Update placeholder value.

                // The new values to apply to the spreadsheet.
                data: [{
                        "majorDimension": "ROWS",
                        "range": "Data!A1",
                        "values": [
                            [
                                text_val
                            ]
                        ]
                    },
                    {
                        "majorDimension": "ROWS",
                        "range": "Data!B1",
                        "values": [
                            [
                                formula_val
                            ]
                        ]
                    }
                ] // TODO: Update placeholder value.
                // TODO: Add desired properties to the request body.
            };

            var request = gapi.client.sheets.spreadsheets.values.batchUpdate(params, batchUpdateValuesRequestBody);
            request.then(function(response) {
                // TODO: Change code below to process the `response` object:
                console.log(response.result);
                makeApiCall_Get();
            }, function(reason) {
                console.error('error: ' + reason.result.error.message);
            });
        }


        function handleClientLoad() {
            gapi.load('client:auth2', initClient);
        }

        /**
        *  Called when the signed in status changes, to update the UI
        *  appropriately. After a sign-in, the API is called.
        */
        function updateSignInStatus(isSignedIn) {
            if (isSignedIn) {
                makeApiCall_BatchUpdate();
            }
        }

        function handleSignInClick(event) {
            gapi.auth2.getAuthInstance().signIn();
        }

        function handleSignOutClick(event) {
            gapi.auth2.getAuthInstance().signOut();
        }

        handleClientLoad();
    };

    function Draw(Ar, firsttime) {
        for (var i = 0; i < Ar.length; i++) {
            GoogleSheets(Ar[i].div, Ar[i].value, Ar[i].formula, Ar[i].id, firsttime);
			Amchart(Ar[i].id, Ar[i].div, Ar[i].value, "", firsttime)
        }
    };

    class Box extends HTMLElement {
        constructor() {
            console.log("constructor");
            super();
            shadowRoot = this.attachShadow({
                mode: "open"
            });

            shadowRoot.appendChild(template.content.cloneNode(true));

            this._firstConnection = 0;

            this.addEventListener("click", event => {
                console.log('click');
                var event = new Event("onClick");
                this.dispatchEvent(event);

            });
            this._props = {};
        }

        //Fired when the widget is added to the html DOM of the page
		connectedCallback() {
            console.log("connectedCallback");
        }

		//Fired when the widget is removed from the html DOM of the page (e.g. by hide)
		disconnectedCallback() {
			console.log("disconnectedCallback");
        }

		//When the custom widget is updated, the Custom Widget SDK framework executes this function first
        onCustomWidgetBeforeUpdate(changedProperties) {
            console.log("onCustomWidgetBeforeUpdate");
            this._props = {
                ...this._props,
                ...changedProperties
            };
        }

		//When the custom widget is updated, the Custom Widget SDK framework executes this function after the update
        onCustomWidgetAfterUpdate(changedProperties) {

            console.log("onCustomWidgetAfterUpdate");
            console.log(changedProperties);

            if ("value" in changedProperties) {
                console.log("value:" + changedProperties["value"]);
                this.$value = changedProperties["value"];
            }

            if ("formula" in changedProperties) {
                console.log("formula:" + changedProperties["formula"]);
                this.$formula = changedProperties["formula"];

            }

            console.log("firsttime: " + this._firstConnection);
            var that = this;

            if (this._firstConnection === 0) {
                const div = document.createElement('div');
                let divid = changedProperties.widgetName;
                this._tagContainer = divid;
                div.innerHTML = '<div id="container_' + divid + '"></div>';
                shadowRoot.appendChild(div);

                const css = document.createElement('div');
                css.innerHTML = '<style>#container_' + divid + ' {width: 100%; height: 500px;}</style>'
                shadowRoot.appendChild(css);

                var mapcanvas_divstr = shadowRoot.getElementById('container_' + divid);
                console.log(mapcanvas_divstr);
                Ar.push({
                    'id': divid,
                    'div': mapcanvas_divstr,
                    'value': this.$value,
                    'formula': this.$formula,
                });

				async function LoadLibs() {
					try {
						await loadScript(googlesheetsjs);
						await loadScript(amchartscorejs);				
						await loadScript(amchartschartsjs);				
						await loadScript(amchartsanimatedjs);
					} catch (e) {
						alert(e);
					} finally {
						Draw(Ar, that._firstConnection);
						that._firstConnection = 1;
					}
				}
				LoadLibs();
				

            } else {
                var id = this.$value.split("|")[0];
                console.log("id: " + id);

                var value = this.$value.split("|")[1];
                console.log("value: " + value);

                var formula = this.$formula;
                console.log("formula: " + formula);

                if (value !== "") {
                    var foundIndex = Ar.findIndex(x => x.id == id);
                    console.log("foundIndex: " + foundIndex);

                    if (foundIndex !== -1) {
                        console.log(Ar[foundIndex].div);
                        GoogleSheets(Ar[foundIndex].div, value, formula, id, this._firstConnection);
						Amchart(id, Ar[foundIndex].div, "", "", this._firstConnection)
                    }
                }
            }
        }

		//When the custom widget is removed from the canvas or the analytic application is closed
        onCustomWidgetDestroy() {
			console.log("onCustomWidgetDestroy");
        }
    }
    customElements.define("com-fd-googlesheetsstock", Box);
})();u
