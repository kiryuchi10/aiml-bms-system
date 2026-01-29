This file has been created by Joaquín de la Vega Hernández.


CHANGE LOG:
2025-09-09 -> Added cycles 171 to 410.
2025-06-17 -> Creation. Includes 170 cycles.
	
 

GENERAL INFORMATION
------------------

1. Dataset title:
	Lithium-Ion Battery Pack Cycling Dataset with CC-CV Charging and WLTP/Constant Discharge Profiles


2. Authorship:
	Name: de la Vega Hernández, Joaquín
	Institution: Universitat Politècnica de Catalunya
	Email: joaquin.de.la.vega@upc.edu
	ORCID: 0009-0003-9200-0963
	Contributions: Designer, manufacturer, draft writter

	Name: Ortega Redondo, Juan Antonio
	Institution: Universitat Politècnica de Catalunya
	Email: juan.antonio.ortega@upc.edu
	ORCID: 0000-0002-1403-8152
	Contributions: Supervision, database publication

	Name: Riba Ruiz, Jordi Roger
	Institution: Universitat Politècnica de Catalunya
	Email: jordi.riba-ruiz@upc.edu
	ORCID: 0000-0001-8774-2389 
	Contributions: Supervision



DESCRIPTION
----------

1. Dataset language:
	- English

2. Abstract:
	This work presents a database of a Lithium-ion battery pack cycling test generated from a custom testbench that simulates dynamic driving conditions based on the WLTP cycle. 
	The current profiles are derived from speed–time data using MATLAB/Simulink and a Tesla Model 3 vehicle model. 
	The dataset includes the time series of cell voltages, currents, surface temperatures, and pack-level resistance across up to 36 cells arranged in three parallel branches. 
	Data is recorded under controlled thermal conditions and stored in an efficient PARQUET format. 
	The system uses a CAN bus architecture and commercial automotive BMS units to replicate in-vehicle communication constraints, enhancing the dataset’s relevance for real-world battery management system development and validation.


3. Keywords: 
	Battery pack
	Driving cycle
	WLTP
	Cycling
	Lithium-ion

4. Date of data collection (single date or date range):
	2025-03-23 - 2025-09-03

5. Publication Date:
	2025-10-15


6. Grant information:
	Funding agency: Agencia Estatal de Investigación
	Project number: TED2021-130007B-I00

	Funding agency: Generalitat de Catalunya
	Project number: 2021 SGR 00392



7. Geographical location/s of data collection:
	Latitude: 41.55686
	Longitude: 2.058625
	City: Terrassa
	Region: Catalonia
	Country: Spain

8. Other information:
	Internal test codename: Quetzal (Qtzl)
	Dataset format: PARQUET (Pyarrow v11.0.0 engine)

ACCESS INFORMATION
------------------------
	This dataset is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) license.

	You are free to:
	- Share — copy and redistribute the material in any medium or format
	- Adapt — remix, transform, and build upon the material for any purpose, even commercially

	Under the following terms:
	- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.

	License details: https://creativecommons.org/licenses/by/4.0/

	Please cite this dataset as:
	de la Vega Hernández, Joaquín, Ortega Redondo, Juan Antonio & Riba Ruiz, Jordi Roger. “Lithium-Ion Battery Pack Cycling Dataset with CC-CV Charging and WLTP/Constant Discharge Profiles”, 1.0, Universitat Politècnica de Catalunya, 2025. DOI: https://doi.org/10.34810/data2395

1. Creative Commons License of the dataset:
	CC BY 4.0

2. Dataset DOI:
	10.34810/data2395

VERSIONING AND PROVENANCE
---------------

1. Last modification date:
	 2025-10-14


2. Were data derived from another source?:
	No 


3. Additional related data not included in this dataset:
	Not applicable


METHODOLOGICAL INFORMATION
-----------------------

1. Description of the methods used to collect and generate the data:
	The dataset includes the measurement performed to 36 commercially available lithium-ion Panasonic NCR18650B batteries in a 3-parallel of 12 in series arrangement.
	Voltage, current, temperature, resistance, and humidity were measured at multiple points in the system using dedicated instrumentation.
		- Cell voltage and current data are collected by three battery management systems (BMS). 
		- Temperature and humidity data were collected using seven Arduino UNO R3 microcontrollers.
		- Voltage and resistance at pack level is collected by an ITECH IT5101 battery tester that communicated directly with the main computer via a serial communication.
		- Arduinos and BMS stream the data through a CAN bus from which the main computer gathers all the measurements.

	The entire system is controlled by a custom Python 3 script. It continuously reads data from the CAN bus and the connected measurement devices, 
	storing the results in a structured Apache Parquet database. Due to non-uniform sampling and asynchronous data collection,
	 a zero-order hold (ZOH) method is applied between records. Although each record includes its own timestamp,
	 the system is designed to operate at a minimum sampling rate of 2 Hz. The usage of CAN aims to further simulate the data availability conditions and limitations.

	Each record consists of 132 elements, including:
		- Cycle number: A sequential number that increments at the start of every discharge semicycle. Each cycle contains one charge and one discharge stage.
		- Timestamp: In ISO 8601 format.
		- Semicycle: Indicates the operational stage of the power supply, such as “Capacity charge,” “WLTP,” “Standby,” and others.
		- Voltage [V]: 46 voltage-related measurements, comprising:
			- 36 individual cell voltages
			- 3 branch-level voltages
			- 2 pack-level voltages
			- 5 statistical values. Minimum, maximum and average voltage value across all cells and the minim and maximum voltage value of the whole battery pack.
		- Current [A]: 5 current measurements, including:
			- 1 per branch (3 in total)
			- 1 total current through the battery terminals
			- 2 peak values: maximum charge and maximum discharge current
		- Temperature [Celsius degrees]: 77 temperature measurements in degrees Celsius, including:
			- 72 cell temperatures (top and bottom of each cell)
			- 2 ambient temperatures (inside and outside the thermal chamber)
		- Relative humidity [%RH] within the test chamber.
		- Resistance [Ohm]: Resistance measured at the bus bars where the battery pack is connected, obtained using the IT5101 battery tester.
		- State of Charge [percentage]: The BMS provides the estimation through Coulomb counting, which is complemented by OCV-based and end-of-charge/discharge calibrations.
	
	Cell identification:
		The system consists of 36 cells, arranged in 3 parallel branches, each containing 12 cells in series. 
		Within each branch, cells are numbered from 1 (most negative) to 12 (most positive). 
		Each branch is labeled sequentially from 1 to 3. 
		The naming convention uses P# (for Parallel) to indicate the branch and S# (for Series) to identify the specific cell within that branch. 
		For example, the 8th cell in the 2nd branch is labeled P2S8.
	
	Semicycles:
		- WLTP: Dynamic driving cycle current profile limited by the cell specifications in the battery pack.
				The cut-off voltage is 38.4 V. The sequence consists of 1800 steps at regular 1-second intervals, with charge (positive) and discharge (negative) current values. 
				Once the sequence is completed, it restarts and continues until the cut-off voltage is reached.
		- Constant Charge: CC-CV profile. 1 A per active branch in CC. Cut-off current of 0.07 A per active branch. Cut-off voltage of 50.5 V and 43200 seconds of cut-off time
		- Constant Discharge: 1.6 A per active branch. Cut-off Voltage of 38.4 V
		- Capacity Check Charge: CC-CV profile. 0.5 A per active branch in CC. Cut-off current of 0.07 A per active branch. Cut-off voltage of 50.5 V and 46080 seconds of cut-off time
		- Capacity Check Discharge: 0.64 A per active branch. Cut-off Voltage of 38.4 V
		- Fast Charge: CC-CV profile. 1.62 A per active branch in CC. Cut-off current of 0.07 A per active branch. Cut-off voltage of 50.5 V and 43200 seconds of cut-off timestamp
		- Fast Discharge: 4.16 A per active branch. Cut-off Voltage of 38.4 V
		- Stand-by: No current applied. Waiting for the main computer to request the next semicycle stage.
		- Balancing: Any of the BMS has detect that the system is unbalanced inside a branch or between the branches. The system tries to balance itself.
	
	Driving Cycle Simulation
		To accurately simulate real-world battery demands, the Worldwide Harmonized Light Vehicles Test Procedure (WLTP) Class 3 driving cycle was selected. 
		As the WLTP is defined in terms of vehicle speed versus time, it was first converted into a current versus time profile suitable for battery testing.
		This conversion was performed using MATLAB and Simulink version 2024b, leveraging the Powertrain Blockset.
		An electromechanical model of a Tesla Model 3 was constructed within the simulation environment, incorporating relevant dynamic parameters such as 
		vehicle mass, aerodynamic drag coefficient, rolling resistance, braking force distribution, and drivetrain efficiency.
		The resulting output current profile, which represents the current demands of the vehicle throughout the WLTP cycle, was exported and used to drive the real battery system under test.
	
	
	
2. Data processing methods:
	The dataset contains raw measurements obtained from various devices. All floating-point values streamed through the CAN bus
	 were rounded and limited to three decimal places for communication purposes.
	The dataset was split into multiple files based on the cycle number.

3. Software or instruments needed to interpret the data:
	None

4. Information about instruments, calibration and standards:

	System control:
		- The system is controlled using a Windows 11 machine on a Intel i5-12450H processor.
		- Three Wattius wBMS-R24 modules (one per branch) in a Master-Slave configuration to handle system contactors and broadcast data through CAN bus.
		- Seven Arduino UNO R3 to acquire 
	
	Communication:
		- CAN interface with Kvaser U100
	
	Power control:
		A programmable, bidirectional ITECH IT3632 DC power source is used to apply the current profiles via Standard Commands for Programmable Instruments (SCPI) sent from the main computer. 

	Sensors:
		- Current: Hall efect LEM HASS 50-S current transducer
		- Temperature: TDK B57861S0103F045 10kOhm thermistors to measure surface temperature of cells. Handsontec 10kOhm 3950k thermistors to measure in and out chamber temperature.
		- Humidity: Seeed AM2302 temperature and humidity transducer.
		- ITECH IT5101 for Voltage and Resistance measurement of the whole battery pack
		- Wattius wBMS-R24 for voltage measurement of each cell.

	Calibration:
		All thermistors were individually calibrated using a CEM BX-150 dry-well calibrator.

5. Environmental or experimental conditions:
		To ensure more stable test conditions, all the components were placed inside a programmable PREBATEM 150L temperature chamber by JP-SELECTA.
		Temperature inside and outside the chamber was continuously measured using 10 kΩ NTC thermistors (3950K).
		Humidity inside the temperature chamber is also continuously measured using an AM2302 humidity transducer.


FILE OVERVIEW
----------------------

1. Explain the file naming conversion, if applicable:

	For PARQUET files, the name is based on the test codename (Quetzal [Qtzl]) and a sequential cycle number. Cycles are temporally ordered.
	The naming convention follows the template: Qtzl_Cycle_#.parquet, where # represents the cycle number.
	For example, the data related to the first cycle is named: Qtzl_Cycle_1.parquet.
	
2. Column description:
  ________________________________________________________________________________________________________________________
    Column name                                - Description
  ________________________________________________________________________________________________________________________
    Cycle                                      - Cycle number
    Semicycle                                  - Operational stage of the power supply (e.g., WLTP, Charge, Discharge, etc.).
    Timestamp                                  - Time record in ISO 8601 format for each measurement record.
    Current_Actual_Battery [A]                 - Measured total current through the battery terminals in amperes.
    Voltage_Actual_Battery [V]                 - Measured total voltage across the entire battery pack in volts.
    SoC_Actual_Battery [percent]               - Battery SoC estimated by the BMS as a percentage.
    Temperature_IN_Chamber [degC]              - Ambient temperature measured inside the thermal chamber in Celsius degrees.
    Temperature_OUT_Chamber [degC]             - Ambient temperature measured outside the thermal chamber in Celsius degrees.
    Humidity_IN_Chamber [RH_percent]           - Relative humidity percentage measured within the thermal chamber.
    Voltage_Actual_P1 [V]                      - Measured voltage of Branch 1
    Voltage_Actual_P2 [V]                      - Measured voltage of Branch 2
    Voltage_Actual_P3 [V]                      - Measured voltage of Branch 3
    Resistance_Actual_Battery_IT5101 [Ohm]     - Resistance measured by the IT5101 tester at battery terminals in Ohms
    Voltage_Actual_Battery_IT5101 [V]          - Battery pack voltage measured by the IT5101 tester at battery terminals in volts
    Voltage_Avg_Cell [V]                       - Average voltage across all cells in the battery pack in volts.
    Voltage_Min_Cell [V]                       - Minimum voltage value among all cells or branches in volts.
    Voltage_Max_Cell [V]                       - Maximum voltage value among all cells or branches in volts.
    Current_Max_Charge [A]                     - Peak maximum charge current recorded during the cycle in amperes.
    Current_Max_Discharge [A]                  - Peak maximum discharge current recorded during the cycle in amperes.
    Voltage_Min_Battery [V]                    - Measured total voltage across the entire battery pack in volts.
    Voltage_Max_Battery [V]                    - Measured total voltage across the entire battery pack in volts.
    Current_Actual_P1 [A]                      - Measured current across Branch 1 in Ampers
    Current_Actual_P2 [A]                      - Measured current across Branch 2 in Ampers
    Current_Actual_P3 [A]                      - Measured current across Branch 3 in Ampers
    Voltage_Cell_P1S1 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 1 
    Voltage_Cell_P1S2 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 2 
    Voltage_Cell_P1S3 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 3 
    Voltage_Cell_P1S4 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 4 
    Voltage_Cell_P1S5 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 5 
    Voltage_Cell_P1S6 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 6 
    Voltage_Cell_P1S7 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 7 
    Voltage_Cell_P1S8 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 8 
    Voltage_Cell_P1S9 [V]                      - Instantaneous voltage of cell in Branch:1 , Series: 9 
    Voltage_Cell_P1S10 [V]                     - Instantaneous voltage of cell in Branch:1 , Series: 10
    Voltage_Cell_P1S11 [V]                     - Instantaneous voltage of cell in Branch:1 , Series: 11
    Voltage_Cell_P1S12 [V]                     - Instantaneous voltage of cell in Branch:1 , Series: 12
    Voltage_Cell_P2S1 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 1 
    Voltage_Cell_P2S2 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 2 
    Voltage_Cell_P2S3 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 3 
    Voltage_Cell_P2S4 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 4 
    Voltage_Cell_P2S5 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 5 
    Voltage_Cell_P2S6 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 6 
    Voltage_Cell_P2S7 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 7 
    Voltage_Cell_P2S8 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 8 
    Voltage_Cell_P2S9 [V]                      - Instantaneous voltage of cell in Branch:2 , Series: 9 
    Voltage_Cell_P2S10 [V]                     - Instantaneous voltage of cell in Branch:2 , Series: 10
    Voltage_Cell_P2S11 [V]                     - Instantaneous voltage of cell in Branch:2 , Series: 11
    Voltage_Cell_P2S12 [V]                     - Instantaneous voltage of cell in Branch:2 , Series: 12
    Voltage_Cell_P3S1 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 1 
    Voltage_Cell_P3S2 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 2 
    Voltage_Cell_P3S3 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 3 
    Voltage_Cell_P3S4 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 4 
    Voltage_Cell_P3S5 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 5 
    Voltage_Cell_P3S6 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 6 
    Voltage_Cell_P3S7 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 7 
    Voltage_Cell_P3S8 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 8 
    Voltage_Cell_P3S9 [V]                      - Instantaneous voltage of cell in Branch:3 , Series: 9 
    Voltage_Cell_P3S10 [V]                     - Instantaneous voltage of cell in Branch:3 , Series: 10
    Voltage_Cell_P3S11 [V]                     - Instantaneous voltage of cell in Branch:3 , Series: 11
    Voltage_Cell_P3S12 [V]                     - Instantaneous voltage of cell in Branch:3 , Series: 12
    Temperature_Cell_Top_P1S1 [degC]           - Temperature at Top of cell in Branch:1 , Series: 1  in Celsius degrees
    Temperature_Cell_Bottom_P1S1 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 1  in Celsius degrees
    Temperature_Cell_Top_P1S2 [degC]           - Temperature at Top of cell in Branch:1 , Series: 2  in Celsius degrees
    Temperature_Cell_Bottom_P1S2 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 2  in Celsius degrees
    Temperature_Cell_Top_P1S3 [degC]           - Temperature at Top of cell in Branch:1 , Series: 3  in Celsius degrees
    Temperature_Cell_Bottom_P1S3 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 3  in Celsius degrees
    Temperature_Cell_Top_P1S4 [degC]           - Temperature at Top of cell in Branch:1 , Series: 4  in Celsius degrees
    Temperature_Cell_Bottom_P1S4 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 4  in Celsius degrees
    Temperature_Cell_Top_P1S5 [degC]           - Temperature at Top of cell in Branch:1 , Series: 5  in Celsius degrees
    Temperature_Cell_Bottom_P1S5 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 5  in Celsius degrees
    Temperature_Cell_Top_P1S6 [degC]           - Temperature at Top of cell in Branch:1 , Series: 6  in Celsius degrees
    Temperature_Cell_Bottom_P1S6 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 6  in Celsius degrees
    Temperature_Cell_Top_P1S7 [degC]           - Temperature at Top of cell in Branch:1 , Series: 7  in Celsius degrees
    Temperature_Cell_Bottom_P1S7 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 7  in Celsius degrees
    Temperature_Cell_Top_P1S8 [degC]           - Temperature at Top of cell in Branch:1 , Series: 8  in Celsius degrees
    Temperature_Cell_Bottom_P1S8 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 8  in Celsius degrees
    Temperature_Cell_Top_P1S9 [degC]           - Temperature at Top of cell in Branch:1 , Series: 9  in Celsius degrees
    Temperature_Cell_Bottom_P1S9 [degC]        - Temperature at Bottom of cell in Branch:1 , Series: 9  in Celsius degrees
    Temperature_Cell_Top_P1S10 [degC]          - Temperature at Top of cell in Branch:1 , Series: 10 in Celsius degrees
    Temperature_Cell_Bottom_P1S10 [degC]       - Temperature at Bottom of cell in Branch:1 , Series: 10 in Celsius degrees
    Temperature_Cell_Top_P1S11 [degC]          - Temperature at Top of cell in Branch:1 , Series: 11 in Celsius degrees
    Temperature_Cell_Bottom_P1S11 [degC]       - Temperature at Bottom of cell in Branch:1 , Series: 11 in Celsius degrees
    Temperature_Cell_Top_P1S12 [degC]          - Temperature at Top of cell in Branch:1 , Series: 12 in Celsius degrees
    Temperature_Cell_Bottom_P1S12 [degC]       - Temperature at Bottom of cell in Branch:1 , Series: 12 in Celsius degrees
    Temperature_Cell_Top_P2S1 [degC]           - Temperature at Top of cell in Branch:2 , Series: 1  in Celsius degrees
    Temperature_Cell_Bottom_P2S1 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 1  in Celsius degrees
    Temperature_Cell_Top_P2S2 [degC]           - Temperature at Top of cell in Branch:2 , Series: 2  in Celsius degrees
    Temperature_Cell_Bottom_P2S2 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 2  in Celsius degrees
    Temperature_Cell_Top_P2S3 [degC]           - Temperature at Top of cell in Branch:2 , Series: 3  in Celsius degrees
    Temperature_Cell_Bottom_P2S3 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 3  in Celsius degrees
    Temperature_Cell_Top_P2S4 [degC]           - Temperature at Top of cell in Branch:2 , Series: 4  in Celsius degrees
    Temperature_Cell_Bottom_P2S4 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 4  in Celsius degrees
    Temperature_Cell_Top_P2S5 [degC]           - Temperature at Top of cell in Branch:2 , Series: 5  in Celsius degrees
    Temperature_Cell_Bottom_P2S5 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 5  in Celsius degrees
    Temperature_Cell_Top_P2S6 [degC]           - Temperature at Top of cell in Branch:2 , Series: 6  in Celsius degrees
    Temperature_Cell_Bottom_P2S6 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 6  in Celsius degrees
    Temperature_Cell_Top_P2S7 [degC]           - Temperature at Top of cell in Branch:2 , Series: 7  in Celsius degrees
    Temperature_Cell_Bottom_P2S7 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 7  in Celsius degrees
    Temperature_Cell_Top_P2S8 [degC]           - Temperature at Top of cell in Branch:2 , Series: 8  in Celsius degrees
    Temperature_Cell_Bottom_P2S8 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 8  in Celsius degrees
    Temperature_Cell_Top_P2S9 [degC]           - Temperature at Top of cell in Branch:2 , Series: 9  in Celsius degrees
    Temperature_Cell_Bottom_P2S9 [degC]        - Temperature at Bottom of cell in Branch:2 , Series: 9  in Celsius degrees
    Temperature_Cell_Top_P2S10 [degC]          - Temperature at Top of cell in Branch:2 , Series: 10 in Celsius degrees
    Temperature_Cell_Bottom_P2S10 [degC]       - Temperature at Bottom of cell in Branch:2 , Series: 10 in Celsius degrees
    Temperature_Cell_Top_P2S11 [degC]          - Temperature at Top of cell in Branch:2 , Series: 11 in Celsius degrees
    Temperature_Cell_Bottom_P2S11 [degC]       - Temperature at Bottom of cell in Branch:2 , Series: 11 in Celsius degrees
    Temperature_Cell_Top_P2S12 [degC]          - Temperature at Top of cell in Branch:2 , Series: 12 in Celsius degrees
    Temperature_Cell_Bottom_P2S12 [degC]       - Temperature at Bottom of cell in Branch:2 , Series: 12 in Celsius degrees
    Temperature_Cell_Top_P3S1 [degC]           - Temperature at Top of cell in Branch:3 , Series: 1  in Celsius degrees
    Temperature_Cell_Bottom_P3S1 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 1  in Celsius degrees
    Temperature_Cell_Top_P3S2 [degC]           - Temperature at Top of cell in Branch:3 , Series: 2  in Celsius degrees
    Temperature_Cell_Bottom_P3S2 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 2  in Celsius degrees
    Temperature_Cell_Top_P3S3 [degC]           - Temperature at Top of cell in Branch:3 , Series: 3  in Celsius degrees
    Temperature_Cell_Bottom_P3S3 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 3  in Celsius degrees
    Temperature_Cell_Top_P3S4 [degC]           - Temperature at Top of cell in Branch:3 , Series: 4  in Celsius degrees
    Temperature_Cell_Bottom_P3S4 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 4  in Celsius degrees
    Temperature_Cell_Top_P3S5 [degC]           - Temperature at Top of cell in Branch:3 , Series: 5  in Celsius degrees
    Temperature_Cell_Bottom_P3S5 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 5  in Celsius degrees
    Temperature_Cell_Top_P3S6 [degC]           - Temperature at Top of cell in Branch:3 , Series: 6  in Celsius degrees
    Temperature_Cell_Bottom_P3S6 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 6  in Celsius degrees
    Temperature_Cell_Top_P3S7 [degC]           - Temperature at Top of cell in Branch:3 , Series: 7  in Celsius degrees
    Temperature_Cell_Bottom_P3S7 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 7  in Celsius degrees
    Temperature_Cell_Top_P3S8 [degC]           - Temperature at Top of cell in Branch:3 , Series: 8  in Celsius degrees
    Temperature_Cell_Bottom_P3S8 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 8  in Celsius degrees
    Temperature_Cell_Top_P3S9 [degC]           - Temperature at Top of cell in Branch:3 , Series: 9  in Celsius degrees
    Temperature_Cell_Bottom_P3S9 [degC]        - Temperature at Bottom of cell in Branch:3 , Series: 9  in Celsius degrees
    Temperature_Cell_Top_P3S10 [degC]          - Temperature at Top of cell in Branch:3 , Series: 10 in Celsius degrees
    Temperature_Cell_Bottom_P3S10 [degC]       - Temperature at Bottom of cell in Branch:3 , Series: 10 in Celsius degrees
    Temperature_Cell_Top_P3S11 [degC]          - Temperature at Top of cell in Branch:3 , Series: 11 in Celsius degrees
    Temperature_Cell_Bottom_P3S11 [degC]       - Temperature at Bottom of cell in Branch:3 , Series: 11 in Celsius degrees
    Temperature_Cell_Top_P3S12 [degC]          - Temperature at Top of cell in Branch:3 , Series: 12 in Celsius degrees
    Temperature_Cell_Bottom_P3S12 [degC]       - Temperature at Bottom of cell in Branch:3 , Series: 12 in Celsius degrees
  ________________________________________________________________________________________________________________________

3. File list:

    File name:     Readme.txt
	Description:   This file
	
	File name: 	WLTP_Driving_cycle_reference.csv
	Description:   	File containing the time series of the WLTP. The original in km/h, the current equivalent of the original profile obtained from the electromechanical model and the adapted current profile for the tested battery pack specifications.
          
	File name:   Qtzl_Cycle_001_Capacity_check_partial_data.parquet
	Description: Cycle 001. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_002_Capacity_check_partial_data.parquet
	Description: Cycle 002. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_003_WLTP_partial_data.parquet
	Description: Cycle 003. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_004_WLTP_partial_data.parquet
	Description: Cycle 004. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_005_WLTP_partial_data.parquet
	Description: Cycle 005. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_006_WLTP_partial_data.parquet
	Description: Cycle 006. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_007_WLTP_partial_data.parquet
	Description: Cycle 007. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_008_WLTP_partial_data.parquet
	Description: Cycle 008. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_009_WLTP_partial_data.parquet
	Description: Cycle 009. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_010_WLTP_partial_data.parquet
	Description: Cycle 010. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_011_WLTP_partial_data.parquet
	Description: Cycle 011. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_012_WLTP_partial_data.parquet
	Description: Cycle 012. Semicycles: Capacity check Discharge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_013_Capacity_check_partial_data.parquet
	Description: Cycle 013. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_014_Capacity_check_partial_data.parquet
	Description: Cycle 014. Semicycles: Capacity check Charge, Capacity check Discharge, Fast Charge, Fast Discharge, Stand by

	File name:   Qtzl_Cycle_015_Capacity_check_partial_data.parquet
	Description: Cycle 015. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_016_Capacity_check_partial_data.parquet
	Description: Cycle 016. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_017_WLTP_partial_data.parquet
	Description: Cycle 017. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_018_WLTP_partial_data.parquet
	Description: Cycle 018. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_019_WLTP_partial_data.parquet
	Description: Cycle 019. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_020_Capacity_check_partial_data.parquet
	Description: Cycle 020. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_021_Capacity_check_partial_data.parquet
	Description: Cycle 021. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_022_WLTP_partial_data.parquet
	Description: Cycle 022. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_023_WLTP_partial_data.parquet
	Description: Cycle 023. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_024_Capacity_check_partial_data.parquet
	Description: Cycle 024. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_025_Capacity_check_partial_data.parquet
	Description: Cycle 025. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_026_Capacity_check_partial_data.parquet
	Description: Cycle 026. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_027_Capacity_check_partial_data.parquet
	Description: Cycle 027. Semicycles: Balancing, Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_028_WLTP_partial_data.parquet
	Description: Cycle 028. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_029_WLTP_partial_data.parquet
	Description: Cycle 029. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_030_WLTP_partial_data.parquet
	Description: Cycle 030. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_031_WLTP_partial_data.parquet
	Description: Cycle 031. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_032_WLTP_partial_data.parquet
	Description: Cycle 032. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_033_WLTP_partial_data.parquet
	Description: Cycle 033. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_034_Capacity_check_partial_data.parquet
	Description: Cycle 034. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_035_WLTP_partial_data.parquet
	Description: Cycle 035. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_036_WLTP_partial_data.parquet
	Description: Cycle 036. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_037_Capacity_check_partial_data.parquet
	Description: Cycle 037. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_038_Capacity_check_partial_data.parquet
	Description: Cycle 038. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_039_Capacity_check_partial_data.parquet
	Description: Cycle 039. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_040_WLTP_partial_data.parquet
	Description: Cycle 040. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_041_WLTP_partial_data.parquet
	Description: Cycle 041. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_042_Capacity_check_partial_data.parquet
	Description: Cycle 042. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_043_Capacity_check_partial_data.parquet
	Description: Cycle 043. Semicycles: Balancing, Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_044_WLTP_partial_data.parquet
	Description: Cycle 044. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_045_WLTP_partial_data.parquet
	Description: Cycle 045. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_046_WLTP_partial_data.parquet
	Description: Cycle 046. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_047_Capacity_check_partial_data.parquet
	Description: Cycle 047. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_048_Capacity_check_partial_data.parquet
	Description: Cycle 048. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_049_Capacity_check_partial_data.parquet
	Description: Cycle 049. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_050_Capacity_check_partial_data.parquet
	Description: Cycle 050. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_051_Capacity_check_partial_data.parquet
	Description: Cycle 051. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_052_Capacity_check_partial_data.parquet
	Description: Cycle 052. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_053_WLTP_partial_data.parquet
	Description: Cycle 053. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_054_WLTP_partial_data.parquet
	Description: Cycle 054. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_055_WLTP_partial_data.parquet
	Description: Cycle 055. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_056_WLTP_partial_data.parquet
	Description: Cycle 056. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_057_WLTP_partial_data.parquet
	Description: Cycle 057. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_058_Capacity_check_partial_data.parquet
	Description: Cycle 058. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_059_Capacity_check_partial_data.parquet
	Description: Cycle 059. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_060_WLTP_partial_data.parquet
	Description: Cycle 060. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_061_WLTP_partial_data.parquet
	Description: Cycle 061. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_062_WLTP_partial_data.parquet
	Description: Cycle 062. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_063_WLTP_partial_data.parquet
	Description: Cycle 063. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_064_WLTP_partial_data.parquet
	Description: Cycle 064. Semicycles: Balancing, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_065_WLTP_partial_data.parquet
	Description: Cycle 065. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_066_WLTP_partial_data.parquet
	Description: Cycle 066. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_067_Capacity_check_partial_data.parquet
	Description: Cycle 067. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_068_Capacity_check_partial_data.parquet
	Description: Cycle 068. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_069_WLTP_partial_data.parquet
	Description: Cycle 069. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_070_WLTP_partial_data.parquet
	Description: Cycle 070. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_071_WLTP_partial_data.parquet
	Description: Cycle 071. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_072_WLTP_partial_data.parquet
	Description: Cycle 072. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_073_Capacity_check_partial_data.parquet
	Description: Cycle 073. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_074_Capacity_check_partial_data.parquet
	Description: Cycle 074. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_075_WLTP_partial_data.parquet
	Description: Cycle 075. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_076_WLTP_partial_data.parquet
	Description: Cycle 076. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_077_WLTP_partial_data.parquet
	Description: Cycle 077. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_078_WLTP_partial_data.parquet
	Description: Cycle 078. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_079_WLTP_partial_data.parquet
	Description: Cycle 079. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_080_WLTP_partial_data.parquet
	Description: Cycle 080. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_081_WLTP_partial_data.parquet
	Description: Cycle 081. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_082_Capacity_check_partial_data.parquet
	Description: Cycle 082. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_083_Capacity_check_partial_data.parquet
	Description: Cycle 083. Semicycles: Capacity check Charge, Capacity check Discharge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_084_WLTP_partial_data.parquet
	Description: Cycle 084. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_085_WLTP_partial_data.parquet
	Description: Cycle 085. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_086_WLTP_partial_data.parquet
	Description: Cycle 086. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_087_Capacity_check_partial_data.parquet
	Description: Cycle 087. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_088_Capacity_check_partial_data.parquet
	Description: Cycle 088. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_089_Capacity_check_partial_data.parquet
	Description: Cycle 089. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_090_WLTP_partial_data.parquet
	Description: Cycle 090. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_091_WLTP_partial_data.parquet
	Description: Cycle 091. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_092_WLTP_partial_data.parquet
	Description: Cycle 092. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_093_WLTP_partial_data.parquet
	Description: Cycle 093. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_094_WLTP_partial_data.parquet
	Description: Cycle 094. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_095_WLTP_partial_data.parquet
	Description: Cycle 095. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_096_WLTP_partial_data.parquet
	Description: Cycle 096. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_097_WLTP_partial_data.parquet
	Description: Cycle 097. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_098_WLTP_partial_data.parquet
	Description: Cycle 098. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_099_Capacity_check_partial_data.parquet
	Description: Cycle 099. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_100_Capacity_check_partial_data.parquet
	Description: Cycle 100. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_101_Capacity_check_partial_data.parquet
	Description: Cycle 101. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_102_WLTP_partial_data.parquet
	Description: Cycle 102. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_103_WLTP_partial_data.parquet
	Description: Cycle 103. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_104_WLTP_partial_data.parquet
	Description: Cycle 104. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_105_WLTP_partial_data.parquet
	Description: Cycle 105. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_106_WLTP_partial_data.parquet
	Description: Cycle 106. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_107_WLTP_partial_data.parquet
	Description: Cycle 107. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_108_WLTP_partial_data.parquet
	Description: Cycle 108. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_109_WLTP_partial_data.parquet
	Description: Cycle 109. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_110_WLTP_partial_data.parquet
	Description: Cycle 110. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_111_Capacity_check_partial_data.parquet
	Description: Cycle 111. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_112_Capacity_check_partial_data.parquet
	Description: Cycle 112. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_113_Capacity_check_partial_data.parquet
	Description: Cycle 113. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_114_WLTP_partial_data.parquet
	Description: Cycle 114. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_115_WLTP_partial_data.parquet
	Description: Cycle 115. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_116_WLTP_partial_data.parquet
	Description: Cycle 116. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_117_WLTP_partial_data.parquet
	Description: Cycle 117. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_118_WLTP_partial_data.parquet
	Description: Cycle 118. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_119_Capacity_check_partial_data.parquet
	Description: Cycle 119. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_120_Capacity_check_partial_data.parquet
	Description: Cycle 120. Semicycles: Capacity check Charge, Capacity check Discharge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_121_WLTP_partial_data.parquet
	Description: Cycle 121. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_122_Capacity_check_partial_data.parquet
	Description: Cycle 122. Semicycles: Capacity check Charge, Capacity check Discharge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_123_Capacity_check_partial_data.parquet
	Description: Cycle 123. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_124_Capacity_check_partial_data.parquet
	Description: Cycle 124. Semicycles: Capacity check Charge, Capacity check Discharge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_125_Capacity_check.parquet
	Description: Cycle 125. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_126_Capacity_check.parquet
	Description: Cycle 126. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by, WLTP

	File name:   Qtzl_Cycle_127_WLTP.parquet
	Description: Cycle 127. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_128_WLTP.parquet
	Description: Cycle 128. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_129_WLTP.parquet
	Description: Cycle 129. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_130_WLTP.parquet
	Description: Cycle 130. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_131_WLTP.parquet
	Description: Cycle 131. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_132_WLTP.parquet
	Description: Cycle 132. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_133_WLTP.parquet
	Description: Cycle 133. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_134_WLTP.parquet
	Description: Cycle 134. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_135_WLTP.parquet
	Description: Cycle 135. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_136_WLTP.parquet
	Description: Cycle 136. Semicycles: Capacity check Charge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_137_WLTP.parquet
	Description: Cycle 137. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_138_WLTP.parquet
	Description: Cycle 138. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_139_WLTP.parquet
	Description: Cycle 139. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_140_WLTP.parquet
	Description: Cycle 140. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_141_WLTP.parquet
	Description: Cycle 141. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_142_WLTP.parquet
	Description: Cycle 142. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_143_WLTP.parquet
	Description: Cycle 143. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_144_WLTP.parquet
	Description: Cycle 144. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_145_WLTP.parquet
	Description: Cycle 145. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_146_Capacity_check.parquet
	Description: Cycle 146. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_147_Capacity_check.parquet
	Description: Cycle 147. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_148_WLTP.parquet
	Description: Cycle 148. Semicycles: Capacity check Charge, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_149_WLTP.parquet
	Description: Cycle 149. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_150_WLTP.parquet
	Description: Cycle 150. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_151_Capacity_check.parquet
	Description: Cycle 151. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_152_Capacity_check.parquet
	Description: Cycle 152. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_153_WLTP.parquet
	Description: Cycle 153. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_154_Capacity_check.parquet
	Description: Cycle 154. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_155_Capacity_check.parquet
	Description: Cycle 155. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_156_WLTP.parquet
	Description: Cycle 156. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_157_WLTP.parquet
	Description: Cycle 157. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_158_WLTP.parquet
	Description: Cycle 158. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_159_WLTP.parquet
	Description: Cycle 159. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_160_WLTP.parquet
	Description: Cycle 160. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_161_WLTP.parquet
	Description: Cycle 161. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_162_WLTP.parquet
	Description: Cycle 162. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_163_WLTP.parquet
	Description: Cycle 163. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_164_WLTP.parquet
	Description: Cycle 164. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_165_WLTP.parquet
	Description: Cycle 165. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_166_Capacity_check.parquet
	Description: Cycle 166. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_167_Capacity_check.parquet
	Description: Cycle 167. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_168_WLTP.parquet
	Description: Cycle 168. Semicycles: Balancing, Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_169_Capacity_check.parquet
	Description: Cycle 169. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_170_Capacity_check.parquet
	Description: Cycle 170. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_171_Capacity_check.parquet
	Description: Cycle 171. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_172_Capacity_check.parquet
	Description: Cycle 172. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_173_WLTP.parquet
	Description: Cycle 173. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_174_WLTP.parquet
	Description: Cycle 174. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_175_WLTP.parquet
	Description: Cycle 175. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_176_WLTP.parquet
	Description: Cycle 176. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_177_WLTP.parquet
	Description: Cycle 177. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_178_WLTP.parquet
	Description: Cycle 178. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_179_WLTP.parquet
	Description: Cycle 179. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_180_WLTP.parquet
	Description: Cycle 180. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_181_WLTP.parquet
	Description: Cycle 181. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_182_WLTP.parquet
	Description: Cycle 182. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_183_Capacity_check.parquet
	Description: Cycle 183. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_184_Capacity_check.parquet
	Description: Cycle 184. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_185_WLTP.parquet
	Description: Cycle 185. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_186_WLTP.parquet
	Description: Cycle 186. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_187_WLTP.parquet
	Description: Cycle 187. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_188_WLTP.parquet
	Description: Cycle 188. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_189_WLTP.parquet
	Description: Cycle 189. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_190_WLTP.parquet
	Description: Cycle 190. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_191_WLTP.parquet
	Description: Cycle 191. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_192_WLTP.parquet
	Description: Cycle 192. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_193_WLTP.parquet
	Description: Cycle 193. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_194_WLTP.parquet
	Description: Cycle 194. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_195_Capacity_check.parquet
	Description: Cycle 195. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_196_Capacity_check.parquet
	Description: Cycle 196. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_197_WLTP.parquet
	Description: Cycle 197. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_198_WLTP.parquet
	Description: Cycle 198. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_199_WLTP.parquet
	Description: Cycle 199. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_200_WLTP.parquet
	Description: Cycle 200. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_201_WLTP.parquet
	Description: Cycle 201. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_202_WLTP.parquet
	Description: Cycle 202. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_203_Capacity_check.parquet
	Description: Cycle 203. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_204_Capacity_check.parquet
	Description: Cycle 204. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_205_WLTP.parquet
	Description: Cycle 205. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_206_WLTP.parquet
	Description: Cycle 206. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_207_WLTP.parquet
	Description: Cycle 207. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_208_WLTP.parquet
	Description: Cycle 208. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_209_WLTP.parquet
	Description: Cycle 209. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_210_WLTP.parquet
	Description: Cycle 210. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_211_WLTP.parquet
	Description: Cycle 211. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_212_WLTP.parquet
	Description: Cycle 212. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_213_WLTP.parquet
	Description: Cycle 213. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_214_WLTP.parquet
	Description: Cycle 214. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_215_Capacity_check.parquet
	Description: Cycle 215. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_216_Capacity_check.parquet
	Description: Cycle 216. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_217_WLTP.parquet
	Description: Cycle 217. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_218_WLTP.parquet
	Description: Cycle 218. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_219_Capacity_check.parquet
	Description: Cycle 219. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_220_Capacity_check.parquet
	Description: Cycle 220. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_221_WLTP.parquet
	Description: Cycle 221. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_222_WLTP.parquet
	Description: Cycle 222. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_223_WLTP.parquet
	Description: Cycle 223. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_224_WLTP.parquet
	Description: Cycle 224. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_225_WLTP.parquet
	Description: Cycle 225. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_226_WLTP.parquet
	Description: Cycle 226. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_227_Capacity_check.parquet
	Description: Cycle 227. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_228_Capacity_check.parquet
	Description: Cycle 228. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_229_WLTP.parquet
	Description: Cycle 229. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_230_WLTP.parquet
	Description: Cycle 230. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_231_WLTP.parquet
	Description: Cycle 231. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_232_WLTP.parquet
	Description: Cycle 232. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_233_WLTP.parquet
	Description: Cycle 233. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_234_WLTP.parquet
	Description: Cycle 234. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_235_WLTP.parquet
	Description: Cycle 235. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_236_WLTP.parquet
	Description: Cycle 236. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_237_WLTP.parquet
	Description: Cycle 237. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_238_WLTP.parquet
	Description: Cycle 238. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_239_Capacity_check.parquet
	Description: Cycle 239. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_240_Capacity_check.parquet
	Description: Cycle 240. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_241_Capacity_check.parquet
	Description: Cycle 241. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_242_Capacity_check.parquet
	Description: Cycle 242. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_243_WLTP.parquet
	Description: Cycle 243. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_244_WLTP.parquet
	Description: Cycle 244. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_245_WLTP.parquet
	Description: Cycle 245. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_246_Capacity_check.parquet
	Description: Cycle 246. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_247_Capacity_check.parquet
	Description: Cycle 247. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_248_Capacity_check.parquet
	Description: Cycle 248. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_249_WLTP.parquet
	Description: Cycle 249. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_250_WLTP.parquet
	Description: Cycle 250. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_251_WLTP.parquet
	Description: Cycle 251. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_252_WLTP.parquet
	Description: Cycle 252. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_253_WLTP.parquet
	Description: Cycle 253. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_254_WLTP.parquet
	Description: Cycle 254. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_255_WLTP.parquet
	Description: Cycle 255. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_256_WLTP.parquet
	Description: Cycle 256. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_257_WLTP.parquet
	Description: Cycle 257. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_258_WLTP.parquet
	Description: Cycle 258. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_259_Capacity_check.parquet
	Description: Cycle 259. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_260_Capacity_check.parquet
	Description: Cycle 260. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_261_WLTP.parquet
	Description: Cycle 261. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_262_WLTP.parquet
	Description: Cycle 262. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_263_WLTP.parquet
	Description: Cycle 263. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_264_WLTP.parquet
	Description: Cycle 264. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_265_WLTP.parquet
	Description: Cycle 265. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_266_WLTP.parquet
	Description: Cycle 266. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_267_WLTP.parquet
	Description: Cycle 267. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_268_WLTP.parquet
	Description: Cycle 268. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_269_WLTP.parquet
	Description: Cycle 269. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_270_WLTP.parquet
	Description: Cycle 270. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_271_Capacity_check.parquet
	Description: Cycle 271. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_272_Capacity_check.parquet
	Description: Cycle 272. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_273_WLTP.parquet
	Description: Cycle 273. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_274_WLTP.parquet
	Description: Cycle 274. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_275_Capacity_check.parquet
	Description: Cycle 275. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_276_Capacity_check.parquet
	Description: Cycle 276. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_277_WLTP.parquet
	Description: Cycle 277. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_278_WLTP.parquet
	Description: Cycle 278. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_279_WLTP.parquet
	Description: Cycle 279. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_280_WLTP.parquet
	Description: Cycle 280. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_281_Capacity_check.parquet
	Description: Cycle 281. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_282_Capacity_check.parquet
	Description: Cycle 282. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_283_WLTP.parquet
	Description: Cycle 283. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_284_WLTP.parquet
	Description: Cycle 284. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_285_WLTP.parquet
	Description: Cycle 285. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_286_WLTP.parquet
	Description: Cycle 286. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_287_WLTP.parquet
	Description: Cycle 287. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_288_WLTP.parquet
	Description: Cycle 288. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_289_WLTP.parquet
	Description: Cycle 289. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_290_WLTP.parquet
	Description: Cycle 290. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_291_WLTP.parquet
	Description: Cycle 291. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_292_WLTP.parquet
	Description: Cycle 292. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_293_Capacity_check.parquet
	Description: Cycle 293. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_294_Capacity_check.parquet
	Description: Cycle 294. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_295_Capacity_check.parquet
	Description: Cycle 295. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_296_Capacity_check.parquet
	Description: Cycle 296. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_297_WLTP.parquet
	Description: Cycle 297. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_298_WLTP.parquet
	Description: Cycle 298. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_299_WLTP.parquet
	Description: Cycle 299. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_300_WLTP.parquet
	Description: Cycle 300. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_301_WLTP.parquet
	Description: Cycle 301. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_302_WLTP.parquet
	Description: Cycle 302. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_303_WLTP.parquet
	Description: Cycle 303. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_304_WLTP.parquet
	Description: Cycle 304. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_305_WLTP.parquet
	Description: Cycle 305. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_306_WLTP.parquet
	Description: Cycle 306. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_307_Capacity_check.parquet
	Description: Cycle 307. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_308_Capacity_check.parquet
	Description: Cycle 308. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_309_WLTP.parquet
	Description: Cycle 309. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_310_WLTP.parquet
	Description: Cycle 310. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_311_WLTP.parquet
	Description: Cycle 311. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_312_WLTP.parquet
	Description: Cycle 312. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_313_WLTP.parquet
	Description: Cycle 313. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_314_WLTP.parquet
	Description: Cycle 314. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_315_WLTP.parquet
	Description: Cycle 315. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_316_WLTP.parquet
	Description: Cycle 316. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_317_WLTP.parquet
	Description: Cycle 317. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_318_WLTP.parquet
	Description: Cycle 318. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_319_Capacity_check.parquet
	Description: Cycle 319. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_320_Capacity_check.parquet
	Description: Cycle 320. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_321_WLTP.parquet
	Description: Cycle 321. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_322_WLTP.parquet
	Description: Cycle 322. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_323_WLTP.parquet
	Description: Cycle 323. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_324_WLTP.parquet
	Description: Cycle 324. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_325_WLTP.parquet
	Description: Cycle 325. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_326_WLTP.parquet
	Description: Cycle 326. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_327_WLTP.parquet
	Description: Cycle 327. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_328_WLTP.parquet
	Description: Cycle 328. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_329_WLTP.parquet
	Description: Cycle 329. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_330_WLTP.parquet
	Description: Cycle 330. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_331_Capacity_check.parquet
	Description: Cycle 331. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_332_Capacity_check.parquet
	Description: Cycle 332. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_333_WLTP.parquet
	Description: Cycle 333. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_334_WLTP.parquet
	Description: Cycle 334. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_335_WLTP.parquet
	Description: Cycle 335. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_336_WLTP.parquet
	Description: Cycle 336. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_337_WLTP.parquet
	Description: Cycle 337. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_338_WLTP.parquet
	Description: Cycle 338. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_339_WLTP.parquet
	Description: Cycle 339. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_340_WLTP.parquet
	Description: Cycle 340. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_341_WLTP.parquet
	Description: Cycle 341. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_342_WLTP.parquet
	Description: Cycle 342. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_343_Capacity_check.parquet
	Description: Cycle 343. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_344_Capacity_check.parquet
	Description: Cycle 344. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_345_Capacity_check.parquet
	Description: Cycle 345. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_346_Capacity_check.parquet
	Description: Cycle 346. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_347_WLTP.parquet
	Description: Cycle 347. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_348_WLTP.parquet
	Description: Cycle 348. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_349_WLTP.parquet
	Description: Cycle 349. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_350_WLTP.parquet
	Description: Cycle 350. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_351_WLTP.parquet
	Description: Cycle 351. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_352_WLTP.parquet
	Description: Cycle 352. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_353_WLTP.parquet
	Description: Cycle 353. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_354_WLTP.parquet
	Description: Cycle 354. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_355_WLTP.parquet
	Description: Cycle 355. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_356_WLTP.parquet
	Description: Cycle 356. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_357_Capacity_check.parquet
	Description: Cycle 357. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_358_Capacity_check.parquet
	Description: Cycle 358. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_359_WLTP.parquet
	Description: Cycle 359. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_360_WLTP.parquet
	Description: Cycle 360. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_361_WLTP.parquet
	Description: Cycle 361. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_362_WLTP.parquet
	Description: Cycle 362. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_363_WLTP.parquet
	Description: Cycle 363. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_364_WLTP.parquet
	Description: Cycle 364. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_365_WLTP.parquet
	Description: Cycle 365. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_366_WLTP.parquet
	Description: Cycle 366. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_367_WLTP.parquet
	Description: Cycle 367. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_368_WLTP.parquet
	Description: Cycle 368. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_369_Capacity_check.parquet
	Description: Cycle 369. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_370_Capacity_check.parquet
	Description: Cycle 370. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_371_WLTP.parquet
	Description: Cycle 371. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_372_WLTP.parquet
	Description: Cycle 372. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_373_WLTP.parquet
	Description: Cycle 373. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_374_Capacity_check.parquet
	Description: Cycle 374. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_375_Capacity_check.parquet
	Description: Cycle 375. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_376_WLTP.parquet
	Description: Cycle 376. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_377_WLTP.parquet
	Description: Cycle 377. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_378_Capacity_check.parquet
	Description: Cycle 378. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_379_Capacity_check.parquet
	Description: Cycle 379. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_380_WLTP.parquet
	Description: Cycle 380. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_381_WLTP.parquet
	Description: Cycle 381. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_382_WLTP.parquet
	Description: Cycle 382. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_383_WLTP.parquet
	Description: Cycle 383. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_384_WLTP.parquet
	Description: Cycle 384. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_385_WLTP.parquet
	Description: Cycle 385. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_386_WLTP.parquet
	Description: Cycle 386. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_387_WLTP.parquet
	Description: Cycle 387. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_388_WLTP.parquet
	Description: Cycle 388. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_389_WLTP.parquet
	Description: Cycle 389. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_390_Capacity_check.parquet
	Description: Cycle 390. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_391_Capacity_check.parquet
	Description: Cycle 391. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_392_WLTP.parquet
	Description: Cycle 392. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_393_WLTP.parquet
	Description: Cycle 393. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_394_WLTP.parquet
	Description: Cycle 394. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_395_WLTP.parquet
	Description: Cycle 395. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_396_WLTP.parquet
	Description: Cycle 396. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_397_WLTP.parquet
	Description: Cycle 397. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_398_WLTP.parquet
	Description: Cycle 398. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_399_WLTP.parquet
	Description: Cycle 399. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_400_WLTP.parquet
	Description: Cycle 400. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_401_WLTP.parquet
	Description: Cycle 401. Semicycles: Capacity check Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_402_Capacity_check.parquet
	Description: Cycle 402. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_403_Capacity_check.parquet
	Description: Cycle 403. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_404_WLTP.parquet
	Description: Cycle 404. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_405_Capacity_check.parquet
	Description: Cycle 405. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_406_Capacity_check.parquet
	Description: Cycle 406. Semicycles: Capacity check Charge, Capacity check Discharge, Stand by

	File name:   Qtzl_Cycle_407_WLTP.parquet
	Description: Cycle 407. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_408_WLTP.parquet
	Description: Cycle 408. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_409_WLTP.parquet
	Description: Cycle 409. Semicycles: Constant Charge, Stand by, WLTP

	File name:   Qtzl_Cycle_410_WLTP.parquet
	Description: Cycle 410. Semicycles: Constant Charge, Stand by, WLTP




3. Relationship between files:
	Not applicable

4. File format:
	.txt for files with information about experiments
	.csv for the driving cycle profile reference
	.parquet for each cycle data

5. If the dataset includes multiple files, specify the directory structure and relationships between the files:
	All the files are in the same directory