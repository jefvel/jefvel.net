import{j as a,a as d,F as f,S as u}from"./vendor.0eb51d6d.js";const p=function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function c(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerpolicy&&(r.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?r.credentials="include":e.crossorigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=c(e);fetch(e.href,r)}};p();const t=a,s=d,m=f;function h(l){return s(m,{children:[s("div",{className:"content",children:[t("h1",{children:"jefvel"}),s("p",{className:"links",children:[t("a",{class:"link",href:"//jefvel.newgrounds.com",target:"_blank",rel:"noopener noreferrer",children:"newgrounds"}),t("a",{class:"link",href:"//twitter.com/jefvel",target:"_blank",rel:"noopener noreferrer",children:"twitter"}),t("a",{class:"link",href:"//github.com/jefvel",target:"_blank",rel:"noopener noreferrer",children:"github"}),t("a",{class:"link",href:"/presskit",children:"presskit"})]})]}),t("div",{class:"corner bottomRight"}),t("div",{class:"corner bottomLeft"}),t("div",{class:"corner topRight"})]})}u(t(h,{}),document.getElementById("app"));
