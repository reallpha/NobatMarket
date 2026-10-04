const fs=require("fs");
const lines=[];
lines.push(String.fromCharCode(34)+"use client"+String.fromCharCode(34)+";");
lines.push("");
lines.push("import { useState, useRef } from "+String.fromCharCode(34)+"react"+String.fromCharCode(34)+";");
lines.push("import toast from "+String.fromCharCode(34)+"react-hot-toast"+String.fromCharCode(34)+";");
const target="src/components/features/profile/ProfileSettings.tsx";
console.log("Script started");
