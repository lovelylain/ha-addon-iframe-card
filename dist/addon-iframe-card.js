(function(r){typeof define=="function"&&define.amd?define(r):r()})(function(){"use strict";const r=window.loadCardHelpers,_=t=>{const e=window;(e.customCards||(e.customCards=[])).push(t)},m=async(t,e)=>{let s=null;try{s=await t.callWS({type:"supervisor/api",endpoint:`/addons/${e}/info`,method:"get"})}catch{}return s},l=async t=>{const s=(await t.callWS({type:"supervisor/api",endpoint:"/ingress/session",method:"post"})).session;return document.cookie=`ingress_session=${s};path=/api/hassio_ingress/;SameSite=Strict${location.protocol==="https:"?";Secure":""}`,s},g=async(t,e)=>{await t.callWS({type:"supervisor/api",endpoint:"/ingress/validate_session",method:"post",data:{session:e}})};let n=window.__ingressSession;if(!n){const t=()=>({session:"",refCount:0});let e=t();n=window.__ingressSession={get session(){return e.session},get refCount(){return e.refCount},async init(s){if(!s)return!1;if(e.hass=s,e.timer===void 0){try{e.session=await l(s)}catch{return!1}e.timer===void 0&&(e.timer=setInterval(async()=>{const i=e.hass;try{await g(i,e.session)}catch{e.session=await l(i)}},6e4),e.refCount=0)}return++e.refCount,!0},fini(){e.timer!==void 0&&(--e.refCount,clearTimeout(e.finiTimer),e.finiTimer=setTimeout(()=>{delete e.finiTimer,e.refCount<=0&&e.timer!==void 0&&(clearInterval(e.timer),e=t())},6e4))}}}const c="hui-iframe-card",o="iframe",f="addon-iframe-card",p=`custom:${f}`;let d;(async()=>{let t=customElements.get(c);t===void 0&&((await r()).createCardElement({type:o}),await customElements.whenDefined(c),t=customElements.get(c)),d=t})();class C extends HTMLElement{constructor(){super(...arguments),this._disconnected=!0}static async getConfigElement(){return await d.getConfigElement()}static getStubConfig(){const e=d.getStubConfig();return e.type=p,e}connectedCallback(){delete this._disconnected,this._isIngress&&n.init(this.hass)}disconnectedCallback(){this._disconnected=!0,this._isIngress&&n.fini()}set hass(e){this._iframe?this._iframe.hass=e:(this._hass=e,this._config&&this._config.type!==o&&this._setConfig(e,this._config))}get hass(){return this._iframe?this._iframe.hass:this._hass}set layout(e){this._iframe?this._iframe.layout=e:this._layout=e}get layout(){return this._iframe?this._iframe.layout:this._layout}getCardSize(){return this._iframe?this._iframe.getCardSize():5}setConfig(e){if(!e.url)throw new Error("URL required");const s=this.hass;s?this._setConfig(s,e):this._config=e}async _setConfig(e,s){s=(()=>{const{type:a,...h}=s;return(!this._config||this._config.type!==o)&&(this._config={type:o}),Object.assign(this._config,h)})();const i=await this._fixConfig(e,s);if(i&&!await n.init(e))throw new Error("Unable to create an Ingress session");this._isIngress&&(n.fini(),delete this._isIngress),i&&(this._isIngress=!0,this._disconnected&&n.fini()),await this._updateIframe(s)}async _fixConfig(e,s){if(/^((\w+:)?\/\/[^/]+)?\/api\/hassio_ingress\/[^/]+/.test(s.url))return!0;const i=s.url.match(/^([\w-]+)(?:$|\/)(.*)/);if(!i)return!1;const[,a,h]=i,u=await m(e,a);if(!u)throw new Error(`Unable to fetch add-on info of '${a}'`);if(!u.ingress_url)throw new Error(`Add-on '${a}' does not support Ingress`);return s.url=`${u.ingress_url.replace(/\/+$/,"")}/${h}`,!0}async _updateIframe(e){let s=this._iframe;s?s.setConfig(e):(this._iframe=(await r()).createCardElement(e),s=this._iframe,this.appendChild(s),this._layout!==void 0&&(s.layout=this._layout,delete this._layout),this._hass&&(s.hass=this._hass,delete this._hass))}}customElements.define(f,C),_({type:f,name:"Ingress webpage",description:"Webpage card with addon ingress support.",documentationURL:"https://github.com/lovelylain/ha-addon-iframe-card"})});
