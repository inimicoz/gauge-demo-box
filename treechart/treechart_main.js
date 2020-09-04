(function () {
    let d3script = document.createElement("script");
    d3script.src = "https://inimicoz.github.io/gauge-demo-box/treechart/svg.js";
    d3script.async = false;
    document.head.appendChild(d3script);

    let tmpl = document.createElement('template');
    tmpl.innerHTML = '\
    <style>\
        * {\
            transition: opacity 0.25s;\
        }\
        .roothover rect,\
        .roothover text,\
        .roothover polygon {\
            opacity: 0.5;\
        }\
        .hover rect,\
        .hover text,\
        .hover polygon {\
            opacity: 1;\
            cursor: pointer;\
        }\
        .roothover .bg {\
            opacity: 1\
        }\
    </style>\
    <div id="svg" width="100%" height="100%"></div>\
    ';

    class SankeyTreeChart extends HTMLElement {
        constructor() {
            super();
            let shadowRoot = this.attachShadow({ mode: 'open' });
            shadowRoot.appendChild(tmpl.content.cloneNode(true));
            this.style.height = "100%";
            this.style.display = "block";

            this.properties = {
                columnWidth: 200,
                padding: 20,
                rootHeight: 500,
                drilldown: 3,
                fontsize: 14,
                textColor: "#fff",
                direction: 1,
                data: {}
            };

            this.dimensionMap = {};
            this.wData = {};

            this.update();
        }

        resize() {
            if (this.svg) {
                this.shadowRoot.querySelector("#svg").childNodes[0].remove();
            }
            const aabb = this.getBoundingClientRect();
            const width = aabb.width;
            const height = aabb.height;
            this.svg = SVG(this.shadowRoot.querySelector("#svg")).size(width, height);
            this.pattern = this.svg.pattern(8, 8, (function (add) {
                add.line(0.5, 0, 0.5, 8).stroke({ color: this.properties.graphColor });
            }).bind(this)).attr({ patternTransform: "rotate(45 0 0)", id: "dashed" });
            const bg = this.svg.rect(width, height).attr({ fill: this.bgColor });

            this.bounding = aabb;

            if (this.properties.direction == -1) {
                this.svg.viewbox(-width, 0, width, height);
                bg.move(-width, 0);
            }

            //a map of the levels y position to keep track of the stack heights
            this.level = [0];
        }

        draw() {
            this.calcRootPosition();
            this.wData.name = "";
            this.wData.guid = "";
            this.drawRecursive(this.wData, 0, this.svg);
        };

        update() {
            if (this.debounce) clearTimeout(this.debounce);
            this.debounce = setTimeout(() => {
                this.resize();
                this.draw();
            }, 50);
        }

        hover(group) {
            if (this.blurNode && (!this.selection || this.selection.DOM !== group.node.children[0].id)) {
                clearTimeout(this.timeout);
                this.fireBlur();
                if (this.selection) {
                    this.deselect();
                }
            }
            this.wData.DOM.parent().attr({ class: 'roothover' });
            group.attr({ class: 'hover' });
            this.dispatchEvent(new Event('onHover'));
        }

        blur(group) {
            this.blurNode = group;
            if (this.selection) {
                //when something is selected don't send blur event -> will be triggered by another hover
                return;
            }
            this.timeout = setTimeout(() => {
                this.fireBlur()
            }, 300);
        }

        fireBlur() {
            this.wData.DOM.parent().attr({ class: '' });
            this.blurNode.attr({ class: '' });
            this.blurNode = undefined;
            this.dispatchEvent(new Event('onBlur'));
        }

        deselect() {
            this.fireOnSelect();
        }

        select(dataNode) {
            if (this.selection !== undefined) {
                return this.deselect();
            }

            this.fireOnSelect(dataNode);
        }

        attachHoverListener(aNode, group) {
            if (document.body.querySelector(".sapAppBuildingOutlineCanvasSplitter")) return;
            aNode.forEach(node => {
                node.on("mouseenter", () => this.hover(group));
                node.on("mouseleave", () => this.blur(group));
            });
        }

        attachClickListener(ASvgNode, dataNode) {
            if (document.body.querySelector(".sapAppBuildingOutlineCanvasSplitter")) return;
            ASvgNode.forEach(node => node.on("click", () => this.select(dataNode)));
        }

        sanitize(node) {
            const copy = Object.assign({}, node);
            copy.DOM = copy.DOM.node.id;
            if (copy.children) {
                const childrencopy = []
                for (var i = 0; i < copy.children.length; i++) {
                    childrencopy.push(this.sanitize(copy.children[i]));
                }
                Object.assign(copy, { children: childrencopy });
            };
            return copy;
        }

        fireOnSelect(node) {
            this.selection = node && this.sanitize(node);
            this.dispatchEvent(new CustomEvent('propertiesChanged', { "detail": { "properties": { "selection": this.selection } } }));
            this.dispatchEvent(new Event('onSelect'));
        }

        drawRecursive(node, level, group) {
            const g = group.group();
            g.id(node.name || g.id());

            const bg = this.properties.fontsize + 2;

            // if negative: if small -> grey -> else: dashed
            const fill = node.value < 0 ?
                node.height < bg ? "#4c4c4c" : this.pattern
                : this.properties.graphColor;

            node.DOM = g.rect(0, 0)
                .size(node.width, node.height)
                .move(node.x, node.y)
                .fill(fill);
            if (node.height >= bg) node.DOM.stroke({ color: this.properties.graphColor, width: 1 });

            this.drawText(node, g);

            if (node.children && (!this.properties.drilldown | level < this.properties.drilldown)) {
                let offset = 0;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const gg = this.drawRecursive(child, level + 1, g);
                    const arrow = this.drawArrow(node, child, offset, gg);
                    offset += child.realheight;
                    this.attachHoverListener([child.DOM, arrow], gg);
                    this.attachClickListener([child.DOM, arrow], child);
                }
            }

            return g;
        }

        trimText(node, textNode) {
            var text = textNode.text();
            var textLength = textNode.length();
            while (textLength > (node.width - 2 - this.properties.padding * 2) && text.length > 0) {
                text = text.slice(0, -2);
                textNode.text(text + '...');
                textLength = textNode.length();
            }
        }

        drawText(node, group) {
            const bg = node.height < this.properties.fontsize + 2;
            let g;

            if (bg) g = group.group();

            const text = group.text(this.dimensionMap[node.guid] || node.name)
                .font({ family: 'sans-serif', size: this.properties.fontsize, weight: 'bold' });

            this.trimText(node, text);

            text.fill(this.properties.textColor)
                .move(node.x + this.properties.padding, node.y + (node.height - this.properties.fontsize) / 2)

            this.attachHoverListener([text], group);
            this.attachClickListener([text], node);

            let bgr;
            if (bg) {
                bgr = g.rect(text.node.getBoundingClientRect().width + this.properties.padding, node.height + 1).move(node.x + this.properties.padding / 2, node.y - 0.5).attr({ fill: this.bgColor, class: "bg" });
                this.attachHoverListener([bgr], group);
                this.attachClickListener([bgr], node);
            }

            if (this.properties.direction < 0) {
                const m = node.width - text.node.getBBox().width - this.properties.padding * 2;
                text.dx(m);
                bgr && bgr.dx(m);
            }

            return text;
        }

        drawArrow(node, child, offset, group) {
            return group.polygon(
                (this.properties.direction > 0 ?
                    [
                        [node.x + node.width, offset + node.y],
                        [child.x, child.y],
                        [child.x, child.y + child.height],
                        [node.x + node.width, offset + node.y + child.realheight]
                    ]
                    :
                    [
                        [node.x, offset + node.y],
                        [child.x + child.width, child.y],
                        [child.x + child.width, child.y + child.height],
                        [node.x, offset + node.y + child.realheight]
                    ]
                ).map(a => a.join(",")).join(" "))
                .fill({ color: this.properties.graphColor, opacity: 0.3 });
        }

        //calculates absolute sums, treating negative values as positive ones.
        calcSums(d) {
            if (d.children) {
                d.sum = d.children.map(child => this.calcSums(child)).reduce((a, b) => Math.abs(a) + Math.abs(b), 0);
                return d.sum;
            }
            return d.value;
        }

        calcRootPosition() {
            this.dividend = this.wData.sum ? this.wData.sum / this.properties.rootHeight : 1;

            this.wData.x = 0.5;
            this.wData.y = 0;
            this.wData.width = 18;
            this.wData.height = this.properties.rootHeight;

            this.calcPositions(this.wData, undefined, 0);

            if (this.properties.direction == -1) {
                this.flip(this.wData);
            }
        }

        flip(node) {
            node.x *= this.properties.direction;
            node.x -= node.width;
            node.realX = node.x + this.bounding.left + this.bounding.width;

            if (node.children) {
                node.children.forEach(c => this.flip(c));
            }
        }

        calcPositions(node, parent, level) {
            if (parent) {
                const height = Math.abs((node.sum || node.value) / this.dividend);
                node.realheight = height;
                node.height = height > 1 ? Math.round(height) : 1;
                node.x = Math.round(parent.x + parent.width + this.properties.padding * 2);
                node.realX = node.x + this.bounding.left;
                node.y = Math.round(parent.y + this.properties.padding);
                node.width = this.properties.columnWidth;

                this.calcY(node, level);
                //sharper edges
                node.x += 0.5;
                node.y += 0.5;

                node.realY = node.y + this.bounding.top;
            }

            if (node.children) node.children.forEach(child => this.calcPositions(child, node, level + 1));
        }

        calcY(node, level) {
            if (this.level[level] == undefined) {
                this.level.push(level * this.properties.padding);
            }

            if (node.y < this.level[level]) node.y = this.level[level];
            this.level[level] = node.y + node.height + this.properties.padding;
        }

        // very specific for the current API draft. not ready for a release.
        flatToHierarchy(flat) {

            var roots = [] // things without parent

            // make them accessible by guid on this map
            var all = {}

            flat.forEach(function (item) {
                const cTotal = item[item.length - 1];
                const dimensions = cTotal.dimensions;
                const dTotal = dimensions[dimensions.length - 1];
                item.guid = dTotal.dimensionId;
                item.parent = dTotal.parentId;
                item.name = this.dimensionMap[dTotal.dimensionId] || dTotal.dimensionId;

                item.value = Number(cTotal.rawValue);
                item.sum = item.value;
                item.formattedValue = cTotal.formattedValue;

                item.fedValue = item[0].rawValue;
                item.stateValue = item[1].rawValue;

                all[item.guid] = item;
            }.bind(this));

            // connect childrens to its parent, and split roots apart
            Object.keys(all).forEach(function (guid) {
                var item = all[guid]
                if (item.parent === null) {
                    roots.push(item)
                } else if (item.parent in all) {
                    var p = all[item.parent]
                    if (!('children' in p)) {
                        p.children = []
                    }
                    p.children.push(item)
                }
            })

            // done!
            return roots[0] || {};
        }

        mapDimMembers() {
            this.dimensionMap = {};
            this._dimensionMembers.forEach(item => {
                this.dimensionMap[item.id] = item.description;
            });
        }

        set backgroundColor(v) {
            this.bgColor = v;
            this.update();
        }

        set padding(v) {
            this.properties.padding = Number(v);
            this.update();
        }

        set rootHeight(v) {
            this.properties.rootHeight = Number(v);
            this.update();
        }

        set graphColor(v) {
            this.properties.graphColor = v;
            this.update();
        }

        set columnWidth(v) {
            this.properties.columnWidth = Number(v);
            this.update();
        }

        set textColor(v) {
            this.properties.textColor = v;
            this.update();
        }

        set direction(v) {
            this.properties.direction = v != "rtl" ? 1 : -1;
            this.update();
        }

        set data(v) {
            this.properties.data = v;
            this.wData = this.flatToHierarchy(JSON.parse(JSON.stringify(this.properties.data || {})));
            this.calcSums(this.wData);
            this.update();
        }

        get backgroundColor() {
            return this.bgColor;
        }

        get padding() {
            return this.properties.padding.toString();
        }

        get rootHeight() {
            return this.properties.rootHeight.toString();
        }

        get graphColor() {
            return this.properties.graphColor;
        }

        get columnWidth() {
            return this.properties.columnWidth.toString();
        }

        get textColor() {
            return this.properties.textColor;
        }

        get direction() {
            return this.properties.direction == 1 ? "ltr" : "rtl";
        }

        get data() {
            return this.properties.data;
        }

        set dimensionMembers(v) {
            this._dimensionMembers = v;
            this.mapDimMembers();
            this.data = this.properties.data;
            this.update();
        }

        get dimensionMembers() {
            return this._dimensionMembers;
        }

    }

    d3script.onload = () => {
        customElements.define('sdk-stc', SankeyTreeChart);
    };

})();
