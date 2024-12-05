(function(n){typeof define=="function"&&define.amd?define(n):n()})(function(){"use strict";const n=window.loadCardHelpers,u=t=>{const s=window;(s.customCards||(s.customCards=[])).push(t)},_=async(t,s)=>{let e=null;try{e=await t.callWS({type:"supervisor/api",endpoint:`/addons/${s}/info`,method:"get"})}catch{}return e},f=async t=>{const e=(await t.callWS({type:"supervisor/api",endpoint:"/ingress/session",method:"post"})).session;return document.cookie=`ingress_session=${e};path=/api/hassio_ingress/;SameSite=Strict${location.protocol==="https:"?";Secure":""}`,e},m=async(t,s)=>{await t.callWS({type:"supervisor/api",endpoint:"/ingress/validate_session",method:"post",data:{session:s}})},h="hui-iframe-card",o="iframe",l="addon-iframe-card",p=`custom:${l}`;let d;(async()=>{let t=customElements.get(h);t===void 0&&((await n()).createCardElement({type:o}),await customElements.whenDefined(h),t=customElements.get(h)),d=t})();class g extends HTMLElement{static async getConfigElement(){return await d.getConfigElement()}static getStubConfig(){const s=d.getStubConfig();return s.type=p,s}disconnectedCallback(){this._sessionKeepAlive&&clearInterval(this._sessionKeepAlive)}set hass(s){this._iframe?this._iframe.hass=s:(this._hass=s,this._config&&this._config.type!==o&&this._setConfig(s,this._config))}get hass(){return this._iframe?this._iframe.hass:this._hass}set layout(s){this._iframe?this._iframe.layout=s:this._layout=s}get layout(){return this._iframe?this._iframe.layout:this._layout}getCardSize(){return this._iframe?this._iframe.getCardSize():5}setConfig(s){if(!s.url)throw new Error("URL required");const e=this.hass;e?this._setConfig(e,s):this._config=s}async _setConfig(s,e){if(e=(()=>{const{type:i,...a}=e;return(!this._config||this._config.type!==o)&&(this._config={type:o}),Object.assign(this._config,a)})(),await this._fixConfig(s,e)){if(this._sessionKeepAlive===void 0){let i;try{i=await f(s)}catch{throw new Error("Unable to create an Ingress session")}this._sessionKeepAlive=window.setInterval(async()=>{const a=this.hass;try{await m(a,i)}catch{i=await f(a)}},6e4)}}else this._sessionKeepAlive&&clearInterval(this._sessionKeepAlive);await this._updateIframe(e)}async _fixConfig(s,e){const r=e.url.match(/^([\w-]+)(?:$|\/)(.*)/);if(!r)return"";const[,i,a]=r,c=await _(s,i);if(!c)throw new Error(`Unable to fetch add-on info of '${i}'`);if(!c.ingress_url)throw new Error(`Add-on '${i}' does not support Ingress`);return e.url=`${c.ingress_url.replace(/\/+$/,"")}/${a}`,i}async _updateIframe(s){let e=this._iframe;e?e.setConfig(s):(this._iframe=(await n()).createCardElement(s),e=this._iframe,this.appendChild(e),this._layout!==void 0&&(e.layout=this._layout,delete this._layout),this._hass&&(e.hass=this._hass,delete this._hass))}}customElements.define(l,g),u({type:l,name:"Ingress webpage",description:"Webpage card with addon ingress support.",documentationURL:"https://github.com/lovelylain/ha-addon-iframe-card"})});
