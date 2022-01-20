(function () {
  let template = document.createElement("template");
  template.innerHTML = `
		<form id="form">
			<fieldset>
				<legend>Run Parameters</legend>
				<table>
					<tr>
						<td>Environment</td>
						<td><input id="builder_env_id" type="text" size="10" maxlength="3"></td>
					</tr>
					<tr>
						<td>Version</td>
						<td><input id="builder_ver" type="text" size="10" maxlength="4"></td>
					</tr>
					<tr>
						<td>Function ID</td>
						<td><input id="builder_fid" type="text" size="10" maxlength="5"></td>
					</tr>
					<tr>
						<td>Process ID</td>
						<td><input id="builder_proc_id" type="text" size="10" maxlength="7"></td>
					</tr>
				</table>
				<input type="submit" style="display:none;">
			</fieldset>
		</form>
		<style>
		:host {
			display: block;
			padding: 1em 1em 1em 1em;
		}
		</style>
	`;

  class ColoredBoxBuilderPanel extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._shadowRoot
        .getElementById("form")
        .addEventListener("submit", this._submit.bind(this));
    }

    _submit(e) {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              opacity: this.opacity,
            },
          },
        })
      );
    }

    set opacity(newOpacity) {
      this._shadowRoot.getElementById("builder_opacity").value = newOpacity;
    }

    get opacity() {
      return this._shadowRoot.getElementById("builder_opacity").value;
    }
  }

  customElements.define("dk-test-covid-builder", ColoredBoxBuilderPanel);
})();
