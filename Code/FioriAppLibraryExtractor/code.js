function readFAPFile() {
	var files = document.getElementById('selectFAPFile')
		.files;

	if (files.length <= 0) {
		alert("Please choose a Fiori App Library File");
	}
	var oFR = new FileReader();
	oFR.onload = function (e) {
		try {
			var result = JSON.parse(e.target.result);
		} catch (e) {
			console.log(e);
			alert("Reading JSON file with Fiori App Library Content failed!");
			return;
		}
		readRequiredTCodeFile(result);
	}
	oFR.readAsText(files.item(0));
}

function readRequiredTCodeFile(oFAPContent) {
	var files = document.getElementById('selectRequiredTCodeFile')
		.files;
	if (files.length <= 0) {
		alert("Please choose a Required T-Code File");
	}
	var oFR = new FileReader();
	oFR.onload = function (e) {
		try {
			var aRequiredTCodes = e.target.result.split(/\n/);
			var aTrimmedReqTCodes = aRequiredTCodes.filter(tCode => tCode.trim() !== "");
			analyze(oFAPContent, aRequiredTCodes);
		} catch (e) {
			console.log(e);
			alert("Reading CSV file with required T-codes failed!");
			return;
		}
	}
	oFR.readAsText(files.item(0));
}

function beginProcessing() {
	readFAPFile();
}

function analyze(oFAPContent, aRequiredTCodes) {
	var aAllFAPContent = oFAPContent.d.results;
	var aRequiredTCodesInLC = aRequiredTCodes.map(sTcode => sTcode.trim()
		.toLowerCase());
	var oResults = {};
	var bIncludeSAPGUIAndWebDynProApps = document.getElementById("includeWebGUI").checked;
	for (var i = 0; i < aAllFAPContent.length; i++) {

		for (var j = 0; j < aRequiredTCodesInLC.length; j++) {

			var oCurrentFAPLine = aAllFAPContent[i];
			var sCurrentTCode = oCurrentFAPLine.TCodesCombined.toLowerCase();
			var sCurrentAppType = oCurrentFAPLine.AppTypeCombined.toLowerCase().trim();

			if (!oResults[aRequiredTCodes[j]] || !Array.isArray(oResults[aRequiredTCodes[j]].apps)) {
				oResults[aRequiredTCodes[j]] = {
					apps: [],
					isMobileEnabled: false,
					matchFound: false,
					aMobileApps: [],
					isTabletEnabled: false,
					aTabletApps: []
				};

			}

			// Pessimistically assume all apps aren't relevant -
			var bAppIsRelevant = false;

			// Is the app relevant by tcode?
			bAppIsRelevant = sCurrentTCode.indexOf(aRequiredTCodesInLC[j]) !== -1;

			// Do we have to include SAP GUI or dynpro apps?
			if (!bIncludeSAPGUIAndWebDynProApps && bAppIsRelevant) {
				if (sCurrentAppType.indexOf("sap gui") !== -1 || sCurrentAppType.indexOf("web dynpro") !== -1) {
					bAppIsRelevant = false;
				}
			}

			if (bAppIsRelevant) {

				oResults[aRequiredTCodes[j]].apps.push(oCurrentFAPLine);

				oResults[aRequiredTCodes[j]].matchFound = true;

				var sFormFactors = oCurrentFAPLine.FormFactors ? oCurrentFAPLine.FormFactors.toLowerCase() : "";

				var bIsMobile = sFormFactors.indexOf("phone") !== -1;
				var bIsTablet = sFormFactors.indexOf("tablet") !== -1;

				if (bIsMobile && !oResults[aRequiredTCodes[j]].isMobileEnabled)
					oResults[aRequiredTCodes[j]].isMobileEnabled = true;

				if (bIsTablet && !oResults[aRequiredTCodes[j]].bIsTablet)
					oResults[aRequiredTCodes[j]].isTabletEnabled = true;

				if (bIsMobile) oResults[aRequiredTCodes[j]].aMobileApps.push(oCurrentFAPLine);
				if (bIsTablet) oResults[aRequiredTCodes[j]].aTabletApps.push(oCurrentFAPLine);

			};
		}

	}

	// console.log(oResults);
	//debugger;

	downloadToExcel(oResults);

	addTCodesWithoutMobile(oResults);

}

function downloadToExcel(oResults) {

	createHiddenTable(oResults);

	tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
	tab_text = tab_text + '<head><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';

	tab_text = tab_text + '<x:Name>Results</x:Name>';

	tab_text = tab_text + '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
	tab_text = tab_text + '</x:ExcelWorksheets></x:ExcelWorkbook></xml></head><body>';

	tab_text = tab_text + "<table border='1px'>";
	tab_text = tab_text + $('#myModifiedTable').html();
	tab_text = tab_text + '</table></body></html>';

	data_type = 'data:application/vnd.ms-excel';

	//var ua = window.navigator.userAgent;
	//var msie = ua.indexOf("MSIE ");

	//if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
	//    if (window.navigator.msSaveBlob) {
	//        var blob = new Blob([tab_text], {
	//            type: "application/csv;charset=utf-8;"
	//        });
	//        navigator.msSaveBlob(blob, 'Results.xls');
	//    }
	//} else {
	// console.log(data_type);
	// console.log(tab_text);
	$('#testAnchor')[0].click()
		//}
	$('#MessageHolder')
		.html("");

}

function createHiddenTable(ListOfMessages) {
	//var ColumnHead = "Column Header Text";
	//var TableMarkUp='<table id="myModifiedTable"><thead><tr><td><b>'+ColumnHead+'</b></td>  </tr></thead><tbody>';

	//for(i=0; i<ListOfMessages.length; i++){
	//    TableMarkUp += '<tr><td>' + ListOfMessages[i] +'</td></tr>';
	//}
	//TableMarkUp += "</tbody></table>";

	//var aResultSetProperties = ["ACHCombined", "ACHLevel2Combined", "AppLauncherTitleCombined", "AppName", "AppNameAll", "AppNameCombined", "AppTypeCombined", "AppTypeLevel", "ApplicationComponent", "ApplicationComponentText", "ApplicationType", "BExQueryDescriptionCombined", "BExQueryNameCombined", "BSPApplicationURL", "BSPName", "BSPNameCombined", "BackendSCVCombined", "BackendSoftwareComponentVersions", "BusinessCatalog", "BusinessCatalogNameCombined", "BusinessGroupDescriptionCombined", "BusinessGroupNameCombined", "BusinessRoleDescriptionCombined", "BusinessRoleNameCombined", "BusinessRoleOAMName", "Database", "DatabaseCombined", "FitAnalysisACH", "FitAnalysisACHCombined", "FormFactors", "FormFactorsCombined", "FrontendSCVCombined", "FrontendSoftwareComponent", "GTMLoBName", "HANASCVCombined", "HANASoftwareComponentVersions", "HighlightApps", "HighlightAppsSorterL1", "HighlightAppsSorterL2", "HighlightedAppsCombined", "Id", "IndustryCombined", "InnovationsCombined", "IntentsCombined", "LobCombined", "NewRoleName", "ODataServicesCombined", "PCDCombined", "PVBackend", "PVBackendCombined", "PVFrontend", "PVFrontendCombined", "PortfolioCategoryCombined", "PortfolioCategoryIV", "PortfolioCategoryImp", "PrimaryPVOfficialNameCombined", "ProductCategory", "ProductCategoryDetails", "RoleCombinedToolTipDescription", "RoleDescription", "RoleName", "RoleNameCombined", "RoleNameCombinedOnlyName", "SAPUI5ComponentIdCombined", "ScopeItemDetailsCombined", "ScopeItemID", "SolutionsCapabilityCombined", "SolutionsCapabilityGUIDCombined", "SolutionsCapabilityIDCombined", "TCodesCombined", "TechnicalCatalog", "TechnicalCatalogNameCombined", "TitleCombined", "UITechnologyCombined", "WebDynproComponentNameCombined", "appId", "availabilityInFaaSCombined", "otherReleases", "productInstanceBE", "productInstanceHANA", "productInstanceUI", "releaseGroupText", "releaseGroupTextCombined", "releaseId", "releaseName"];
	var aResultSetProperties = ["appId", "URL", "AppName", "AppTypeCombined", "FormFactors", "ACHLevel2Combined", "TCodesCombined",
		"ProductCategory", "Database", "FrontendSoftwareComponent", "BackendSoftwareComponentVersions"
	];
	var TableMarkUp = "<table id='myModifiedTable'><tr>";

	for (var i = 0; i < aResultSetProperties.length; i++)
		TableMarkUp += "<th>" + aResultSetProperties[i] + "</th>";

	TableMarkUp += "</tr>";

	var aAllTCodes = Object.keys(ListOfMessages);
	var aUseless = [];
	//debugger;
	for (var j = 0; j < aAllTCodes.length; j++) {
		if (!ListOfMessages[aAllTCodes[j]].matchFound) {
			aUseless.push(aAllTCodes[j]);
			continue
		};

		TableMarkUp += "<tr><th colspan='" + aResultSetProperties.length + "'>Apps for T-Code: " + aAllTCodes[j] + "</th></tr>";

		var aResultSummary = ListOfMessages[aAllTCodes[j]].apps;

		TableMarkUp += addExcelRowContent(aResultSetProperties, aResultSummary);

	}
	TableMarkUp += "</table>";
	$('#MessageHolder')
		.append(TableMarkUp);

	console.log(JSON.stringify(aUseless));
}

function addExcelRowContent(aResultSetProperties, aRowContent) {

	var tableContent = "";
	for (var i = 0; i < aRowContent.length; i++) {
		tableContent += "<tr>";

		for (var j = 0; j < aResultSetProperties.length; j++) {
			if (aResultSetProperties[j] == "URL") {
				tableContent += "<td>" + escapeXml("https://fioriappslibrary.hana.ondemand.com/sap/fix/externalViewer/#/detail/Apps('" + aRowContent[i]
					.appId + "')/S16OP") + "</td>";
			} else
				tableContent += "<td>" + escapeXml(aRowContent[i][aResultSetProperties[j]]) + "</td>";
		}
		tableContent += "</tr>";
	}
	return tableContent;
}

function escapeXml(unsafe) {

	if (!unsafe) return "";

	return unsafe.replace(/[<>&'"$]/g, function (c) {
		switch (c) {
		case '<':
			return '&lt;';
		case '>':
			return '&gt;';
		case '&':
			return '&amp;';
		case '\'':
			return '&apos;';
		case '"':
			return '&quot;';
		case '$':
			return '';
		}
	});
}

function tableCreate(sId, oErrors, sProperty) {
	var oResultSet = document.getElementById(sId);
	oResultSet.innerText = "";
	oResultSet.innerHTML = "";
	var tbl = document.createElement('table');
	tbl.style.border = '1px solid black';
	tbl.style.width = "100%";
	tbl.style.paddingRight = "15px";
	tbl.style.paddingLeft = "15px";
	tbl.style.marginRight = "auto";
	tbl.style.marginLeft = "auto";
	var aKeys = Object.keys(oErrors);
	var tr = tbl.insertRow();
	var td = tr.insertCell();
	td.appendChild(document.createTextNode("T-Codes with Apps without Mobile Support:"));
	td.style.border = '1px solid black';

	td = tr.insertCell();
	td.appendChild(document.createTextNode("Mobile Support"));
	td.style.border = '1px solid black';

	td = tr.insertCell();
	td.appendChild(document.createTextNode("Tablet Support"));
	td.style.border = '1px solid black';

	td = tr.insertCell();
	td.appendChild(document.createTextNode("Desktop Support"));
	td.style.border = '1px solid black';

	/*
		isMobileEnabled: false,
		aMobileApps: [],
		isTabletEnabled: false,
		aTabletApps: []
	*/
	for (var i = 0; i < aKeys.length; i++) {
		tr = tbl.insertRow();
		td = tr.insertCell();
		td.appendChild(document.createTextNode(aKeys[i]));
		td.style.border = '1px solid black';
		td = tr.insertCell();
		td.appendChild(document.createTextNode(oErrors[aKeys[i]].isMobileEnabled ? "Yes" : "No"));
		td.style.border = '1px solid black';

		td = tr.insertCell();
		td.appendChild(document.createTextNode(oErrors[aKeys[i]].isTabletEnabled ? "Yes" : "No"));
		td.style.border = '1px solid black';

		td = tr.insertCell();
		td.appendChild(document.createTextNode(oErrors[aKeys[i]].matchFound ? "Yes" : "No"));
		td.style.border = '1px solid black';

	}

	oResultSet.appendChild(tbl);
}

function addTCodesWithoutMobile(oResults) {
	tableCreate("fap-resultset-appswithoutmobile", oResults);
}

var tab_text;
var data_type = 'data:application/vnd.ms-excel';