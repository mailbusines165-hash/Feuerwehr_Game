import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas} from '@react-three/fiber';
import {OrbitControls, PerspectiveCamera, Environment, Text} from '@react-three/drei';
import * as THREE from 'three';
import './style.css';

const VEHICLES = [
  ['ELW 1','Einsatzleitung',2], ['ELW 2','Einsatzleitung',2],
  ['DLK 1','Drehleiter',2], ['DLK 2','Drehleiter',2],
  ['HLF 1','Brandbekämpfung / Hilfeleistung',5], ['HLF 2','Brandbekämpfung / Hilfeleistung',5],
  ['HLF 3','Brandbekämpfung / Hilfeleistung',5], ['HLF 4','Brandbekämpfung / Hilfeleistung',5],
  ['LF 1','Löschfahrzeug',4], ['LF 2','Löschfahrzeug',4],
  ['LF 3','Löschfahrzeug',4], ['LF 4','Löschfahrzeug',4],
  ['RTW 1','Rettungsdienst',2], ['RTW 2','Rettungsdienst',2], ['NEF','Notarzt',2]
];

const CALLS = [
  ['Kleinbrand','Mülleimerbrand','Niedrige Gefahr'],
  ['Wohnungsbrand','Brand in einem Wohngebäude','Mittlere Gefahr'],
  ['Großbrand','Brand in einem Einkaufszentrum','Hohe Gefahr'],
  ['Waldbrand','Waldbrand an einer Landstraße','Hohe Gefahr'],
  ['Verkehrsunfall','Verkehrsunfall mit mehreren Verletzten','Mittlere Gefahr'],
  ['Unwetterschaden','Baum auf Fahrbahn','Mittlere Gefahr'],
  ['Personenrettung','Person in Höhe / technische Rettung','Mittlere Gefahr']
];

function Station({onGarage, onStation}) {
  return <group>
    <mesh position={[0,2,0]}><boxGeometry args={[12,4,6]}/><meshStandardMaterial color="#dedede"/></mesh>
    <mesh position={[0,4.4,0]}><boxGeometry args={[12.2,.6,6.2]}/><meshStandardMaterial color="#b71c1c"/></mesh>
    <Text position={[0,3.2,3.08]} fontSize={.65} color="white" anchorX="center">FEUERWEHR</Text>
    {[...Array(6)].map((_,i)=>
      <group key={i} position={[-5.1+i*2.05,1.45,3.12]} onClick={(e)=>{e.stopPropagation();onGarage(i)}}>
        <mesh><boxGeometry args={[1.7,2.5,.18]}/><meshStandardMaterial color="#444"/></mesh>
        <Text position={[0,-1.7,.05]} fontSize={.24} color="white" anchorX="center">TOR {i+1}</Text>
      </group>
    )}
    <mesh position={[0,.15,-.8]} onClick={onStation}><boxGeometry args={[14,.3,9]}/><meshStandardMaterial color="#555"/></mesh>
  </group>
}

function City({onPlaceCall}) {
  const buildings = useMemo(()=>Array.from({length:36},(_,i)=>({
    x:(i%9)*5-20, z:Math.floor(i/9)*6-10, h:1.5+(i%4)*.8
  })),[]);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.12,0]} onClick={onPlaceCall}>
      <planeGeometry args={[80,65]}/><meshStandardMaterial color="#5b7f4a"/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}>
      <planeGeometry args={[7,65]}/><meshStandardMaterial color="#303030"/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.01,0]}>
      <planeGeometry args={[80,7]}/><meshStandardMaterial color="#303030"/>
    </mesh>
    {buildings.map((b,i)=><mesh key={i} position={[b.x,b.h/2,b.z]}>
      <boxGeometry args={[3.5,b.h,3.5]}/><meshStandardMaterial color={['#d8b08c','#b7c8d6','#d9d3a5','#c59aa5'][i%4]}/>
    </mesh>)}
    <group position={[18,.2,-18]}>
      <mesh><cylinderGeometry args={[.16,.16,1.2,12]}/><meshStandardMaterial color="#aaa"/></mesh>
      <Text position={[0,.8,0]} fontSize={.28} color="white" anchorX="center">HYDRANT</Text>
    </group>
    <Station onGarage={onPlaceCall} onStation={onPlaceCall}/>
  </group>
}

function App(){
  const [mode,setMode]=useState('menu');
  const [call,setCall]=useState(null);
  const [selected,setSelected]=useState(null);
  const [custom,setCustom]=useState(false);
  const [time,setTime]=useState(240);

  useEffect(()=>{ if(mode==='free' && !call && time>0){const t=setInterval(()=>setTime(v=>v-1),1000);return()=>clearInterval(t)} },[mode,call,time]);

  function startCall(c){
    setCall(c);
    setTime(0);
    if('speechSynthesis' in window){
      const u=new SpeechSynthesisUtterance(`Einsatzmeldung: ${c[0]}. ${c[1]}.`);
      u.lang='de-DE'; u.rate=.9; window.speechSynthesis.speak(u);
    }
  }

  if(mode==='menu') return <div className="menu">
    <h1>🚒 FEUERWEHR EINSATZLEITER</h1>
    <p>3D-Einsatzleitung – erster spielbarer Prototyp</p>
    <div className="cards">
      <button onClick={()=>setMode('free')}><b>Open-World / Freies Spiel</b><span>Wache, Stadt und freie Kamera</span></button>
      <button onClick={()=>setMode('calls')}><b>Einsätze</b><span>Brände, Verkehrsunfälle, Rettung</span></button>
    </div>
  </div>;

  return <div className="game">
    <div className="topbar">
      <button onClick={()=>{setMode('menu');setCall(null)}}>← Menü</button>
      <strong>{call ? `🚨 ${call[0]}` : '🚒 Feuerwache – Freies Spiel'}</strong>
      <span>{!call && time>0 ? `Nächster Einsatz: ${Math.floor(time/60)}:${String(time%60).padStart(2,'0')}` : 'Einsatz bereit'}</span>
    </div>
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[28,30,28]} fov={45}/>
      <ambientLight intensity={1.2}/>
      <directionalLight position={[10,30,10]} intensity={2} castShadow/>
      <Environment preset="city"/>
      <City onPlaceCall={()=>setCustom(true)}/>
      <OrbitControls enablePan minPolarAngle={.25} maxPolarAngle={1.45}/>
    </Canvas>
    <div className="panel">
      {call ? <>
        <h2>🚨 Einsatzmeldung</h2><p><b>{call[0]}</b><br/>{call[1]}</p>
        <button onClick={()=>setSelected('HLF 1')}>Fahrzeug positionieren</button>
        <button onClick={()=>setSelected('HLF 1')}>Schläuche / Wasserversorgung</button>
        <button onClick={()=>setSelected('DLK 1')}>DLK ausfahren / Personenrettung</button>
        <h3>Nachalarmierung</h3>
        <div className="vehicleList">{VEHICLES.map(v=><button key={v[0]} onClick={()=>setSelected(v[0])}>{v[0]}</button>)}</div>
      </> : <><h2>Wache</h2><p>Klicke auf ein Garagentor oder einen Ort auf der Karte.</p><button onClick={()=>setMode('calls')}>Einsatz auswählen</button></>}
      {selected && <div className="selected">Ausgewählt: <b>{selected}</b><br/><small>In der nächsten Ausbaustufe fährt das Fahrzeug per Straßenpfad zum Einsatzort.</small></div>}
    </div>
    {custom && <div className="modal"><h2>Eigenen Einsatz erstellen</h2><p>Wähle einen Einsatz:</p>{CALLS.map(c=><button key={c[0]} onClick={()=>{setCustom(false);startCall(c)}}>{c[0]} – {c[1]}</button>)}<button onClick={()=>setCustom(false)}>Abbrechen</button></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
