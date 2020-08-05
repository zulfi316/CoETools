function PPTGenerator() {

	return {

		oResultSet: {},
		iDateIndex: 0,
		iTimeIndex: 0,
		iAppServerIndex: 0,
		iMeasuresIndex: 0,
		aDataSet: [],

		init: function () {
			this.oResultSet = {};
			this.iDateIndex = 0;
			this.iTimeIndex = 0;
			this.iAppServerIndex = 0;
			this.iMeasuresIndex = 0;
			this.aDataSet = [];
		},

		setDataPayload: function () {

			// First step will be to get all the different parameters in the passed in dataset

			// Get everything the user entered -
			let sDataSet = document.querySelector("#dataSet").value;

			// No input? Stop
			if (sDataSet.trim() === "")
				throw new Error("- No input -");

			// Split by new line -
			this.aDataSet = sDataSet.split(/\r\n|\n|\r/);

		},

		setMeasuresIndex: function () {
			for (this.iMeasuresIndex = 0; this.iMeasuresIndex < this.aDataSet.length; this.iMeasuresIndex++) {
				if (this.aDataSet[this.iMeasuresIndex].indexOf("AS Instance") !== -1)
					break;
			}

			if (this.iMeasuresIndex === this.aDataSet.length)
				throw new Error("- Invalid input; no AS Instance found in dataset -");

		},

		buildEmptyResultSet: function () {

			// Get the raw measures -

			const aMeasureList = this.aDataSet[this.iMeasuresIndex].split('|').map(measure => measure.trim());

			// There has to be at least three measures, time, app server + one other metric
			if (aMeasureList.length < 3)
				throw new Error("- Invalid input; Measures parsing failed - ");

			//All good, make the result set -
			for (let i = 0; i < aMeasureList.length; i++) {

				const sCurrentMeasure = aMeasureList[i];

				if (sCurrentMeasure) {

					if (sCurrentMeasure !== "") {

						// Is it one of the special measures?
						if (sCurrentMeasure.toLowerCase() == "date" && this.iDateIndex === 0)
							this.iDateIndex = i;

						else if (sCurrentMeasure.toLowerCase() == "time" && this.iTimeIndex === 0)
							this.iTimeIndex = i;

						else if (sCurrentMeasure.toLowerCase() == "as instance" && this.iAppServerIndex === 0)
							this.iAppServerIndex = i;

						else if (this.oResultSet[sCurrentMeasure]) {
							this.oResultSet[sCurrentMeasure + "-1"] = {
								"index": i
							};
						} else {
							this.oResultSet[sCurrentMeasure] = {
								"index": i
							};
						}
					}
				}
			}
		},

		processDataSet: function () {

			this.init();

			this.setDataPayload();

			this.setMeasuresIndex();

			this.buildEmptyResultSet();

			// // TODO: Add this back into result set
			// let sDate = this.aDataSet[0].trim().split(' ')[0];

			let aKnownMeasures = Object.keys(this.oResultSet);

			let aCurrentLine;

			// Start from line 6 // TODO: Make more fool-proof
			for (let i = this.iMeasuresIndex + 2; i < this.aDataSet.length; i++) {

				// Break the line into several pieces -
				aCurrentLine = this.aDataSet[i].split("|");

				// Either a blank line or a line with -----------
				if (aCurrentLine.length < 2)
					continue;

				// Now start a loop for all known measures
				for (let j = 0; j < aKnownMeasures.length; j++) {
					// Break it down -

					// Get the JSON Object associated specifically with this measures -
					let oCurrentMeasure = this.oResultSet[aKnownMeasures[j]];

					// oResultSet[aKnownMeasures[j]][aCurrentLine[iAppServerIndex]]
					// In that JSON Object is there already info about this app server?
					if (!oCurrentMeasure[aCurrentLine[this.iAppServerIndex]])
						oCurrentMeasure[aCurrentLine[this.iAppServerIndex]] = {
							"TimeStamps": [],
							"Values": []
						};

					let oCurrentMeasureAppServer = oCurrentMeasure[aCurrentLine[this.iAppServerIndex]];
					oCurrentMeasureAppServer.TimeStamps.push(aCurrentLine[this.iTimeIndex]);
					try {
						sCurrentLineValue = aCurrentLine[oCurrentMeasure.index];

						sCurrentLineValue = parseFloat(sCurrentLineValue.replace(",", ""));

						if (isNaN(sCurrentLineValue)) {
							debugger;
							throw new Error("Encountred a value that is not a number")
						}
						oCurrentMeasureAppServer.Values.push(sCurrentLineValue);
					} catch (e) {
						alert(e);
						debugger;
					}
				}
			}
			// this.oResultSet.Date = sDate;

			// Data will look like this -
			// {
			// 	"UserLogins": {
			//		"index": 7
			// 		"AppServer 1":{
			// 		"time-stamps": [],
			// 		"values": []
			// 		},
			//		"AppServer 2":{
			// 		"time-stamps": [],
			// 		"values": []
			// 		}
			// 	}
			// }

			return this.oResultSet;
		},

		beginProcessing: function () {

			let aChartData = this.processDataSet();

			// Data will look like this -
			// {
			// 	"UserLogins": {
			//		"index": 7
			// 		"AppServer 1":{
			// 		"time-stamps": [],
			// 		"values": []
			// 		},
			//		"AppServer 2":{
			// 		"time-stamps": [],
			// 		"values": []
			// 		}
			// 	}
			// }

			let pptx = new PptxGenJS();

			let aAllMeasures = Object.keys(aChartData);

			// Do a tweak here to show user info first -
			//Logins and Sessions
			if (aAllMeasures.indexOf("Sessions") !== -1) {
				aAllMeasures = aAllMeasures.filter(items => items !== "Sessions");
				aAllMeasures = ["Sessions", ...aAllMeasures];
			}

			if (aAllMeasures.indexOf("Logins") !== -1) {
				aAllMeasures = aAllMeasures.filter(items => items !== "Logins");
				aAllMeasures = ["Logins", ...aAllMeasures];
			}

			for (let i = 0; i < aAllMeasures.length; i++) {

				let oSpecificInfo = aChartData[aAllMeasures[i]];

				// Maybe we have something that isn't a measure? // TODO: Strengthen check
				if (!oSpecificInfo.index) continue;

				let slide = pptx.addSlide();
				slide.addText(this.getFriendlyText(aAllMeasures[i]), {
					x: 0.5,
					y: 0.7,
					w: 8,
					fontSize: 24
				});

				slide.addText("--- Add Analysis Here ---", {
					x: 0.5,
					y: 4.25,
					w: 8,
					h: 0.5,
					isTextBox: true,
					line: {
						pt: '2',
						color: 'A9A9A9'
					},
					fontSize: 20
				});

				let aAppServers = Object.keys(oSpecificInfo);

				let aAppServerChartInfo = [];
				for (let j = 0; j < aAppServers.length; j++) {
					let sAppServerName = aAppServers[j];

					let oSpecificAppServerInfo = oSpecificInfo[sAppServerName];

					//			Not adding index
					if (oSpecificAppServerInfo.TimeStamps && oSpecificAppServerInfo.Values) {
						aAppServerChartInfo.push({
							name: sAppServerName,
							labels: oSpecificAppServerInfo.TimeStamps,
							values: oSpecificAppServerInfo.Values
						});

					}
				}

				slide.addChart(pptx.ChartType.line, aAppServerChartInfo, {
					x: 0.5,
					y: 1,
					w: 8,
					h: 3,
					valAxisMinVal: 0,
					lineSize: 1,
					lineDataSymbol: "none",
					lineSmooth: true,
					showLegend: true,
					legendPos: 'r',
					catGridLine: {
						color: 'D8D8D8',
						style: 'none',
						size: 1
					},
					valGridLine: {
						color: 'D8D8D8',
						style: 'dash',
						size: 1
					}
				});
			}

			let oGenerateButton = document.querySelector("#reportGenerateButton");

			oGenerateButton.disabled = true;
			oGenerateButton.textContent = "Generating...";

			pptx.writeFile('SDF SMON Report')
				.then(function (fileName) {
					oGenerateButton.disabled = false;
					oGenerateButton.textContent = "Generate Report"

					document.querySelector("#successMessageHolder").innerText = 'Saved! File Name: ' + fileName;

					setTimeout(function () {
						document.querySelector("#successMessageHolder").innerText = ""
					}, 5000);
				});
		},

		getFriendlyText: function (sTitle) {

			switch (sTitle) {
			case "Act. WPs":
				return "Number of Active Work Processes";
			case "Dia.WPs":
				return "Number of Active Dialog Work Processes";
			case "RFC WPs":
				return "Number of available WPs for RFCs";
			case "CPU Usr":
				return "CPU Utilization (User)";
			case "CPU Sys":
				return "CPU Utilization (System)";
			case "CPU Idle":
				return "CPU Utilization (Idle)";
			case "CPU.":
				return "CPUs Consumed";
			case "Ava.":
				return "Available CPUs";
			case "Rea.":
				return "Ready Time in %";
			case "Ste.":
				return "Steal Time in Seconds";
			case "Paging in":
				return "Paging in (% of RAM per hour)";
			case "Paging out":
				return "Paging out  (% of RAM per hour)";
			case "Free Mem.":
				return "Free Memory in % of RAM";
			case "FreeMem":
				return "Free Memory (MB)";
			case "Free(+FS)":
				return "Free Memory MB (incl. Filesystem Cache)";
			case "EM alloc.":
				return "Allocated Extended Memory in MB";
			case "EM attach.":
				return "Attached Extended Memory in MB";
			case "Heap Memor":
				return "Heap Memory in MB";
			case "Pri.":
				return "Priv Modes";
			case "Dia.":
				return "Dialog Queue Length";
			case "Ave.":
				return "Average Load last 20s";
			case "Ave.-1":
				return "Average Load last 60s";
			case "Upd.":
				return "Update Queue Length";
			case "Enq.":
				return "Enqueue Queue Length";
			case "Logins":
				return "Number of logins";
			case "Sessions":
				return "Number of sessions";
			default:
				return sTitle;
			}
		}
	}
}