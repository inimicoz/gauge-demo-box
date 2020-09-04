(function() {
	const template = document.createElement('template');
	template.innerHTML = `	
	`;
		
	let count = 1;
	let script = document.createElement('script');
	script.src = 'https://inimicoz.github.io/gauge-demo-box/custom_bar/Custom_barchartv2';
	script.charset='utf-8'
	script.type='text/javascript'
	let scriptAppend = false;
	document.head.append(script);
	 
	script.onload = () => {
	    	console.log("script loaded...");
			scriptAppend = true;
			customElements.define('custom-barchart', class custom_BarChart extends HTMLElement {
	

		constructor() {
			super();
			this._domAttached = false;
			this._shadowRoot = this.attachShadow({mode: "open"});
			this._shadowRoot.appendChild(template.content.cloneNode(true));
			console.log("Constructor.. "+count);
			count = count + 1;
			this._barcolor = "";
			this.wdth = 0;
			this.hght = 0;
			this._datajson = undefined;
		}

		//Fired when the widget is added to the html DOM of the page
		connectedCallback() {
			this._domAttached = true;
		}
   
		//Fired when the widget is removed from the html DOM of the page (e.g. by hide)
		disconnectedCallback() {
			console.log("deleted");
		}

		//When the custom widget is updated, the Custom Widget SDK framework executes this function first
		onCustomWidgetBeforeUpdate(changedProperties) {

		}

		//When the custom widget is updated, the Custom Widget SDK framework executes this function after the update
		onCustomWidgetAfterUpdate(changedProperties) {
			if ("color" in changedProperties) {
				this._barcolor = changedProperties["color"];
				
			}
			if ("datajson" in changedProperties) {
				this._datajson = changedProperties["datajson"];
				
			}
			if ("chWidth" in changedProperties) {
				this.wdth = changedProperties["chWidth"];
				
				
			}
			if ("chHeight" in changedProperties) {
				this.hght = changedProperties["chHeight"];
				
				
			}
			if(scriptAppend){
				d3.select(this.shadowRoot).select("svg").remove();
				this.redraw();
			}	
		}

		//When the custom widget is removed from the canvas or the analytic application is closed
		onCustomWidgetDestroy() {}


		//When the custom widget is resized on the canvas, the Custom Widget SDK framework executes the following JavaScript function call on the custom widget
		// Commented out by default.  If it is enabled, SAP Analytics Cloud will track DOM size changes and call this callback as needed
		//  If you don't need to react to resizes, you can save CPU by leaving it uncommented.
  
		onCustomWidgetResize(_width, _height){
			
			this.wdth = _width;
			this.hght = _height;
			//dispatching new custom event to capture width & height changes
			this.dispatchEvent(new CustomEvent("propertiesChanged", {
					detail: {
						properties: {
							chWidth: this.chWidth,
							chHeight: this.chHeight
						}
					}
			}));
			
			d3.select(this.shadowRoot).select("svg").remove();
			this.redraw();
		}
  		set chWidth(newWidth) {
			this.wdth = newWidth;
		}

		get chWidth() {
			return this.wdth;
		}
		set chHeight(newHeight) {
			this.hght = newHeight;
		}

		get chHeight() {
			return this.hght;
		}		

		redraw() {
	  		
			console.log("redraw...");  
			console.log(this._datajson);
			var brclr = this._barcolor; 
			var height = this.hght, width = this.wdth, margin = 70;
			var svg = d3.select(this.shadowRoot).append("svg")
   			.attr("width", width).attr("height", height );
    			var xScale = d3.scaleBand().range([0, width-margin]).padding(0.4),
      			yScale = d3.scaleLinear().range([height-margin, 0]);
			
    			var g = svg.append("g")
      			.attr("transform", "translate(" + margin/2 + "," + margin/2 + ")");
			
			var data = [{"year": 2011,"value": 45},{"year": 2012,"value": 47},{"year": 2013,"value": 52},{"year": 2014,"value": 70},{"year": 2015,"value": 75},{"year": 2016,"value": 78}];
			console.log(data);
			xScale.domain(data.map(function(d) {
			return d.year;
			}));
			yScale.domain([0, d3.max(data, function(d) {
			return d.value;
			})]);

			g.append("g")
			.attr("transform", "translate(0," + (height-margin) + ")")
			.call(d3.axisBottom(xScale));

			g.append("g")
			.call(d3.axisLeft(yScale).tickFormat(function(d) {
			return "$" + d;
			}).ticks(10));
			
			
			g.selectAll(".bar")
			.data(data)
			.enter().append("rect")
			.attr("class", "bar")
			.style("fill", brclr)
			.attr("x", function(d) {
			return xScale(d.year);
			})
			.attr("y", function(d) {
			return yScale(d.value);
			})
			.attr("width", xScale.bandwidth())
			.attr("height", function(d) {
			return (height-margin) - yScale(d.value);
			})
			.on("mouseover", function() {
			d3.select(this)
			  .style("fill", "orange");
			})
			.on("mouseout", function() {
			d3.select(this)
			  .style("fill", brclr)
			});


		}
 
	});	
			};
	

})();
