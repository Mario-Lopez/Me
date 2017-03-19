// ==UserScript==
// @name         WME Me
// @version      0.0.4
// @description  Adds a layer to WME that draws ME on the map!
// @author       JustinS83 (Original author: Joshua M. Kriegshauser)
// @match        https://*.waze.com/*editor*
// @match		 https://*.beta.waze.com/*
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @grant        none
// ==/UserScript==

// Version history
// 0.0.1 - Initial release
// 0.0.2 - Tweening of Me, faded Me always follows the center while panning, Me is faded when invisible in chat
// 0.0.2.1 - Change match line to support international editors
// 0.0.3 - Added 'Me!' text to the Me Wazer

WMEMe_Layer = null;
WMEMe_Marker = null;
WMEMe_TempMarker = null;


function WMEMe_ZoomEnd() {
	//console.log('WMEMe_ZoomEnd');
    WMEMe_Marker.moveTo(W.map.getLayerPxFromLonLat(W.map.center));
}

function WMEMe_Drag() {
    //console.log('WMEMe_Drag ' + W.map.getCenter());
    WMEMe_TempMarker.moveTo(W.map.getLayerPxFromLonLat(W.map.getCenter()));
}

function WMEMe_MoveEnd() {
	//console.log('WMEMe_MoveEnd');
    WMEMe_Layer.removeMarker(WMEMe_TempMarker);
    WMEMe_TempMarker = null;
    WMEMe_Marker.moveTo(W.map.getLayerPxFromLonLat(W.map.center));
}

function WMEMe_InstallIcon() {
	OpenLayers.Icon=OpenLayers.Class({url:null,size:null,offset:null,calculateOffset:null,imageDiv:null,px:null,initialize:function(a,b,c,d){this.url=a;this.size=b||{w:20,h:20};this.offset=c||{x:-(this.size.w/2),y:-(this.size.h/2)};this.calculateOffset=d;a=OpenLayers.Util.createUniqueID("OL_Icon_");this.imageDiv=OpenLayers.Util.createAlphaImageDiv(a)},destroy:function(){this.erase();OpenLayers.Event.stopObservingElement(this.imageDiv.firstChild);this.imageDiv.innerHTML="";this.imageDiv=null},clone:function(){return new OpenLayers.Icon(this.url,
	this.size,this.offset,this.calculateOffset)},setSize:function(a){null!=a&&(this.size=a);this.draw()},setUrl:function(a){null!=a&&(this.url=a);this.draw()},draw:function(a){OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,null,this.size,this.url,"absolute");this.moveTo(a);return this.imageDiv},erase:function(){null!=this.imageDiv&&null!=this.imageDiv.parentNode&&OpenLayers.Element.remove(this.imageDiv)},setOpacity:function(a){OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,null,null,null,
	null,null,null,a)},moveTo:function(a){null!=a&&(this.px=a);null!=this.imageDiv&&(null==this.px?this.display(!1):(this.calculateOffset&&(this.offset=this.calculateOffset(this.size)),OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,{x:this.px.x+this.offset.x,y:this.px.y+this.offset.y})))},display:function(a){this.imageDiv.style.display=a?"":"none"},isDrawn:function(){return this.imageDiv&&this.imageDiv.parentNode&&11!=this.imageDiv.parentNode.nodeType},CLASS_NAME:"OpenLayers.Icon"});
}


function WMEMe_Install() {
    var ShowUsername = false;
    //console.log('WMEMe_Install');
    var layer = W.map.getLayersBy('uniqueName', '__WMEMe');
    //console.log('WMEMe_Install:1');
    var newLayer = new OpenLayers.Layer.Markers('Me!', {
        displayInLayerSwitcher: true,
        uniqueName: '__WMEMe'
    });

    // For some reason, OpenLayers.Icon is missing?!?
    if (!OpenLayers.Icon) {
        WMEMe_InstallIcon();
    }

    WMEMe_Layer = newLayer;
    var tween = new OpenLayers.Tween(OpenLayers.Easing.Linear.easeInOut);

    //console.log('WMEMe_Install:2');
    I18n.translations[I18n.currentLocale()].layers.name['__WMEMe'] = 'Me!';
    //console.log('WMEMe_Install:3');
    W.map.addLayer(newLayer);
    //console.log('WMEMe_Install:4');
    newLayer.setVisibility(false);

	WazeWrap.Interface.AddLayerCheckbox("display", "Me", false, function(enabled){newLayer.setVisibility(enabled);});

    //console.log('WMEMe_Install:5');

    var icon = new OpenLayers.Icon('https://www.waze.com/assets-editorimg/live-wazeraba4a171da962f0a1ee4ba4f3fe9619b.png', new OpenLayers.Size(50,42), new OpenLayers.Pixel(-25,-42));
    //console.log('WMEMe_Install:6');

    // Me! Text
    if(ShowUsername)
        $(icon.imageDiv).append($('<div id="WMEME_name">' + WazeWrap.User.Username() + '</div>').css('position','absolute').css('text-align','center').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white'));
    else
        $(icon.imageDiv).append($('<div  id="WMEME_name">Me!</div>').css('position','absolute').css('left','16px').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white'));

    if (!W.model.chat.attributes.visible)
        icon.setOpacity(0.5);

    W.model.chat._events.register('change:visible', null, function(e) {
        icon.setOpacity(W.model.chat.attributes.visible ? 1.0 : 0.5);
    });

    $(icon.imageDiv).click(function(){ShowUsername=!ShowUsername; SetName(ShowUsername);});

    //var marker = new OpenLayers.Marker(
    //newLayer.div.appendChild(WMEMe_Image);
    //newLayer.div.style.textAlign='center';
    W.model.liveUsers.users._events.register('add', null, function(e) {
        WMEMe_LastUser = e;
        console.log('User added: ' + e);
    });

    function tweenToPoint(e) {
        var newlonlat = W.map.center;
        var newpx = W.map.getLayerPxFromLonLat(newlonlat);
        var begin = {x: WMEMe_Marker.icon.px.x, y:WMEMe_Marker.icon.px.y};
        var end = {x: newpx.x, y:newpx.y};
        console.log('tweenToPoint: '+begin.x+','+begin.y+' '+end.x+','+end.y);
        tween.start(begin, end, 10, { callbacks:{
            eachStep: function(e) {
                //console.log('eachStep: '+e.x+','+e.y);
            	WMEMe_Marker.icon.moveTo(e);
        	},
            done: function(e) {
                //console.log('done: '+e.x+','+e.y);
            	WMEMe_Marker.moveTo(newpx);
            }}
        });
        tween.play();
        if (WMEMe_TempMarker) {
            newLayer.removeMarker(WMEMe_TempMarker);
            WMEMe_TempMarker = null;
        }
    }

    W.map.events.register('zoomend', null, tweenToPoint);
    W.map.events.register('move', null, WMEMe_Drag);
    W.map.events.register('moveend', null, tweenToPoint);
    W.map.events.register('movestart', null, function(e) {
        var iconClone = icon.clone();
        iconClone.setOpacity(0.2);
        WMEMe_TempMarker = new OpenLayers.Marker(W.map.center, iconClone);
        newLayer.addMarker(WMEMe_TempMarker);
    });

    WMEMe_Marker = new OpenLayers.Marker(W.map.center, icon);
    newLayer.addMarker(WMEMe_Marker);
}

function SetName(ShowUsername){
    if(ShowUsername){
        $('#WMEME_name')[0].innerHTML = WazeWrap.User.Username();
        $('#WMEME_name').css('position','absolute').css('left','16px').css('position','absolute').css('text-align','center').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white').css('left','initial');
    }
    else{
        $('#WMEME_name')[0].innerHTML = "Me!";
        $('#WMEME_name').css('position','absolute').css('position','absolute').css('left','16px').css('pointer-events','none').css('font-size','12px').css('top','2px').css('color','white');
    }
}

function WMEMe_Bootstrap() {
    console.log('WMEMe_Bootstrap');
    if ($('#user-info') !== undefined && W && W.map && W.model && W.model.chat && W.model.chat.attributes && OpenLayers && OpenLayers.Layer && WazeWrap.User) {
        // Found the me panel
        WMEMe_Install();
    }
    else {
        // Try again in a second
        setTimeout(WMEMe_Bootstrap, 1000);
    }
}

WMEMe_Bootstrap();