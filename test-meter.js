const meterValue = [{"timestamp":"2026-05-09T11:22:47.000Z","sampledValue":[{"value":"224.70","context":"Sample.Periodic","format":"Raw","measurand":"Voltage","phase":"L1-N","unit":"V"},{"value":"14.99","context":"Sample.Periodic","format":"Raw","measurand":"Current.Import","phase":"L1","unit":"A"},{"value":"3366","context":"Sample.Periodic","format":"Raw","measurand":"Power.Active.Import","phase":"L1","unit":"W"},{"value":"0.10","context":"Sample.Periodic","format":"Raw","measurand":"Voltage","phase":"L2-N","unit":"V"},{"value":"0.00","context":"Sample.Periodic","format":"Raw","measurand":"Current.Import","phase":"L2","unit":"A"},{"value":"0","context":"Sample.Periodic","format":"Raw","measurand":"Power.Active.Import","phase":"L2","unit":"W"},{"value":"0.10","context":"Sample.Periodic","format":"Raw","measurand":"Voltage","phase":"L3-N","unit":"V"},{"value":"0.00","context":"Sample.Periodic","format":"Raw","measurand":"Current.Import","phase":"L3","unit":"A"},{"value":"0","context":"Sample.Periodic","format":"Raw","measurand":"Power.Active.Import","phase":"L3","unit":"W"},{"value":"13440","context":"Sample.Periodic","format":"Raw","measurand":"Energy.Active.Import.Register","unit":"Wh"},{"value":"14.99","context":"Sample.Periodic","format":"Raw","measurand":"Current.Import","unit":"A"},{"value":"3366","context":"Sample.Periodic","format":"Raw","measurand":"Power.Active.Import","unit":"W"}]}];

let energyValue = 0;
let powerValue = 0;
let socValue = null;
let currentValue = null;
let voltageValue = null;

if (Array.isArray(meterValue)) {
  for (const mv of meterValue) {
    if (mv.sampledValue && Array.isArray(mv.sampledValue)) {
      for (const sv of mv.sampledValue) {
        const measurand = sv.measurand || "Energy.Active.Import.Register";
        if (measurand === "Energy.Active.Import.Register" || measurand === "Energy") {
          energyValue = parseFloat(sv.value);
        } else if (measurand === "Power.Active.Import" || measurand === "Power") {
          powerValue = parseFloat(sv.value);
        } else if (measurand === "SoC") {
          socValue = parseFloat(sv.value);
        } else if (measurand === "Current.Import" || measurand === "Current.Offered") {
          currentValue = parseFloat(sv.value);
        } else if (measurand === "Voltage") {
          voltageValue = parseFloat(sv.value);
        }
      }
    }
  }
}

console.log("energyValue:", energyValue);
console.log("powerValue:", powerValue);
console.log("socValue:", socValue);
console.log("currentValue:", currentValue);
console.log("voltageValue:", voltageValue);
