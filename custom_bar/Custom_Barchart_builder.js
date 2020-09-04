(function()  {
	let template = document.createElement("template");
	template.innerHTML = `
		<form id="form">
			<fieldset>
				<legend>Bar Properties</legend>
				<table>
					<tr>
						<td>Color</td>
						<td><input type="color" id="bar_color" name="bar_color" value="#4682B4"></td>
					</tr>
				</table>
			</fieldset>				
			<br>				
			<fieldset>
				<legend>Data Binding</legend>
				<table>
					<tr>
						<td><label for="bar_datajson">Data json</label></td>
						<td><textarea id="bar_datajson" name="Data json" rows="7" cols="20">
							Enter your json here</textarea>
						</td>
					</tr>
				</table>
			</fieldset><br>
			<input type="submit" >
		</form>
		<style>
		label{
			display: inline-block;
			text-align: right;
			float: left;
		}
		:host {
			display: block;
			padding: 1em 1em 1em 1em;
		}
		</style>
	`;
	
	class customBuilder extends HTMLElement {
		constructor() {
			super();
			this._shadowRoot = this.attachShadow({mode: "open"});
			this._shadowRoot.appendChild(template.content.cloneNode(true));
			this._shadowRoot.getElementById("form").addEventListener("submit", this._submit.bind(this));
		}

		_submit(e) {
			e.preventDefault();
			this.dispatchEvent(new CustomEvent("propertiesChanged", {
					detail: {
						properties: {
							color: this.color,
							datajson: this.datajson
						}
					}
			}));
		}

		set color(newColor) {
			this._shadowRoot.getElementById("bar_color").value = newColor;
		}

		get color() {
			return this._shadowRoot.getElementById("bar_color").value;
		}
		set datajson(newData) {
			this._shadowRoot.getElementById("bar_datajson").value = newData;
		}

		get datajson() {
			return this._shadowRoot.getElementById("bar_datajson").value;
		}
	}

	customElements.define("custom-builder", customBuilder);
})();
