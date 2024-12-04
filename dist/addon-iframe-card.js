(function(a){typeof define=="function"&&define.amd?define(a):a()})(function(){"use strict";const a=window.loadCardHelpers,f=async(t,e)=>{let s=null;try{s=await t.callWS({type:"supervisor/api",endpoint:`/addons/${e}/info`,method:"get"})}catch{}return s},h=async t=>{const s=(await t.callWS({type:"supervisor/api",endpoint:"/ingress/session",method:"post"})).session;return document.cookie=`ingress_session=${s};path=/api/hassio_ingress/;SameSite=Strict${location.protocol==="https:"?";Secure":""}`,s},_=async(t,e)=>{await t.callWS({type:"supervisor/api",endpoint:"/ingress/validate_session",method:"post",data:{session:e}})},c="hui-iframe-card",d="iframe",u="custom:addon-iframe";let l;(async()=>{let t=customElements.get(c);t===void 0&&((await a()).createCardElement({type:d}),t=customElements.get(c)),l=t})();class m extends HTMLElement{static async getConfigElement(){return await l.getConfigElement()}static getStubConfig(){const e=l.getStubConfig();return e.type=u,e}disconnectedCallback(){this._sessionKeepAlive&&clearInterval(this._sessionKeepAlive)}set hass(e){this._iframe?this._iframe.hass=e:(this._hass=e,this._config&&(this._setConfig(e,this._config),delete this._config))}get hass(){return this._iframe?this._iframe.hass:this._hass}set layout(e){this._iframe?this._iframe.layout=e:this._layout=e}get layout(){return this._iframe?this._iframe.layout:this._layout}getCardSize(){return this._iframe?this._iframe.getCardSize():5}setConfig(e){if(!e.url)throw new Error("URL required");const s=this.hass;s?this._setConfig(s,e):this._config=e}async _setConfig(e,s){if(await this._fixConfig(e,s)){if(this._sessionKeepAlive===void 0){let i;try{i=await h(e)}catch{throw new Error("Unable to create an Ingress session")}this._sessionKeepAlive=window.setInterval(async()=>{const n=this.hass;try{await _(n,i)}catch{i=await h(n)}},6e4)}}else this._sessionKeepAlive&&clearInterval(this._sessionKeepAlive);await this._updateIframe(s)}async _fixConfig(e,s){const r=s.url.match(/^([\w-]+)(?:$|\/)(.*)/);if(!r)return"";const[,i,n]=r,o=await f(e,i);if(!o)throw new Error(`Unable to fetch add-on info of '${i}'`);if(!o.ingress_url)throw new Error(`Add-on '${i}' does not support Ingress`);return s.url=o.ingress_url.replace(/\/+$/,"")+n,i}async _updateIframe(e){e.type=d;let s=this._iframe;s?s.setConfig(e):(this._iframe=(await a()).createCardElement(e),s=this._iframe,this.appendChild(s),this._layout!==void 0&&(s.layout=this._layout,delete this._layout),this._hass&&(s.hass=this._hass,delete this._hass))}}customElements.define("addon-iframe-card",m)});
