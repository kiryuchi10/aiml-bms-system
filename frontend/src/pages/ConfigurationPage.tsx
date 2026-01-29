export function ConfigurationPage() {
  return (
    <div className="panel">
      <div className="panelTitle">Configuration</div>
      <div className="subTabs">
        <button className="subTab active">General</button>
        <button className="subTab">FG Tuning</button>
        <button className="subTab">LED Settings</button>
      </div>

      <div className="formGrid">
        <div className="formPanel">
          <div className="formTitle">Profile Selection</div>
          <div className="formRow">
            <span>Cell type</span>
            <span className="mono">SAMSUNG INR18650-25R</span>
            <button className="btnSmall">Select</button>
          </div>
          <div className="formRow">
            <span>Cell Nominal Capacity [mAh]</span>
            <input className="input" defaultValue={2500} />
          </div>
        </div>

        <div className="formPanel">
          <div className="formTitle">Added Resistance</div>
          <div className="formRow">
            <span>Pack Connection Resistance [mΩ]</span>
            <input className="input" defaultValue={47.7} />
          </div>
          <div className="formRow">
            <span>BMS High Side Resistance [mΩ]</span>
            <input className="input" defaultValue={3.9} />
          </div>
          <div className="formRow">
            <span>BMS Low Side Resistance [mΩ]</span>
            <input className="input" defaultValue={2} />
          </div>
        </div>

        <div className="formPanel">
          <div className="formTitle">Battery Current Limits</div>
          <div className="formRow">
            <span>Max. Charge Current [C-rate]</span>
            <input className="input" defaultValue={1.6} />
          </div>
          <div className="formRow">
            <span>Max. Discharge Current [C-rate]</span>
            <input className="input" defaultValue={3} />
          </div>
        </div>

        <div className="formPanel">
          <div className="formTitle">Battery Pack Configuration</div>
          <div className="formRow">
            <span>Number of Series Cells</span>
            <input className="input" defaultValue={10} />
          </div>
          <div className="formRow">
            <span>Number of Parallel Cells</span>
            <input className="input" defaultValue={1} />
          </div>
          <div className="formRow">
            <span>Number of Stacked Cells</span>
            <input className="input" defaultValue={10} />
          </div>
        </div>

        <div className="formPanel">
          <div className="formTitle">Temperature Settings</div>
          <div className="formRow">
            <span>Max. Charge Temperature [°C]</span>
            <input className="input" defaultValue={50} />
          </div>
          <div className="formRow">
            <span>Max. Discharge Temperature [°C]</span>
            <input className="input" defaultValue={60} />
          </div>
        </div>

        <div className="formPanel">
          <div className="formTitle">Battery Voltage Limits</div>
          <div className="formRow">
            <span>Max. Pack Voltage [mV]</span>
            <input className="input" defaultValue={41750} />
          </div>
          <div className="formRow">
            <span>Min. Pack Voltage [mV]</span>
            <input className="input" defaultValue={27500} />
          </div>
        </div>
      </div>

      <div className="buttonRow">
        <button className="btnWide">Load Config. From File</button>
        <button className="btnWide">Read Config. from FG</button>
        <button className="btnWide">Write Config. on the fly</button>
        <button className="btnWide">Reset Config. to Default</button>
        <button className="btnWide">Save Config. To File</button>
        <button className="btnWide">Write Config. to FG</button>
        <button className="btnWide">Synchronize Configuration</button>
        <button className="btnWide">Reset Lifetime log Registers</button>
      </div>
    </div>
  )
}

