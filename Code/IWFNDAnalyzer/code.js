function tableCreate(oErrors) {
	var tbl = document.createElement('table');
	tbl.style.border = '1px solid black';
	tbl.style.width = "100%";
	tbl.style.paddingRight = "15px";
	tbl.style.paddingLeft = "15px";
	tbl.style.marginRight = "auto";
	tbl.style.marginLeft = "auto";

	var tr = tbl.insertRow();
	var td = tr.insertCell();
	td.appendChild(document.createTextNode('Error'));
	td.style.border = '1px solid black';

	td = tr.insertCell();
	td.appendChild(document.createTextNode('Number of times seen'));
	td.style.border = '1px solid black';

	var aKeys = Object.keys(oErrors);

	for (var i = 0; i < aKeys.length; i++) {

		tr = tbl.insertRow();
		td = tr.insertCell();
		td.appendChild(document.createTextNode(aKeys[i]));
		td.style.border = '1px solid black';

		td = tr.insertCell();
		td.appendChild(document.createTextNode(oErrors[aKeys[i]]));
		td.style.border = '1px solid black';

	}

	return tbl;
}

function sortErrors(oErrors) {

	var oCopyErrors = {};

	var aErrors = Object.keys(oErrors);
	var aProcessedKeys = [];
	var iLargestCount = 0;
	var sLargestKey = "";

	var iCircuitBreaker = 0;

	// Outer loop to ensure we catch everything
	while (aProcessedKeys.length !== aErrors.length) {
		iLargestCount = 0;
		sLargestKey = "";

		// Inner loop on all errors -
		for (var i = 0; i < aErrors.length; i++) {

			// Not found in oCopy errors and is largest -
			if (typeof oCopyErrors[aErrors[i]] === "undefined" &&
				oErrors[aErrors[i]] > iLargestCount) {
				iLargestCount = oErrors[aErrors[i]];
				sLargestKey = aErrors[i];
			}
		}

		oCopyErrors[sLargestKey] = iLargestCount;
		aProcessedKeys.push(sLargestKey);

		iCircuitBreaker++;

		if (iCircuitBreaker > 100000) {
			alert('Breaking after processing 100000 lines!; Cannot do more');
			debugger;
			break;
		}

	}

	return oCopyErrors;

}

function extractErrorMessages(aAllErrors) {

	var sErrorString, aErrors = [],
		aErrorLineParts, iErrorMessageIndex = 0;

	for (var i = 0; i < aAllErrors.length; i++) {

		aErrorLineParts = aAllErrors[i].split('|');

		if (aErrorLineParts.length !== 23)
			continue;

		if (iErrorMessageIndex === 0) {
			iErrorMessageIndex = aErrorLineParts.findIndex(item => item.trim().toLowerCase() === "error text");
		}

		if (iErrorMessageIndex === 0)
			continue;

		sErrorString = aErrorLineParts[iErrorMessageIndex];

		sErrorString = sErrorString ? sErrorString.trim() : "";

		if (sErrorString != "" && sErrorString != "Error Text")
			aErrors.push(sErrorString);
	}

	return aErrors;

}

function beginAnalyze() {

	var oTextArea = document.getElementById('analyzer-analyze-maintextarea');
	var aIWFNDErrorLog = extractErrorMessages(oTextArea.value.split(/\n/));

	var oErrors = {};
	var sErrorString;
	var iAuthErrorCount = 0,
		iChipErrorCount = 0,
		iTotalErrorCount = 0,
		iValueListErrorCount = 0;

	for (var i = 0; i < aIWFNDErrorLog.length; i++) {

		sErrorString = aIWFNDErrorLog[i].toLowerCase().trim();

		if (sErrorString.length === 0)
			continue;

		if (sErrorString.indexOf("authorization") !== -1)
			iAuthErrorCount++;

		if (sErrorString.indexOf("resource chip") !== -1)
			iChipErrorCount++;

		if (sErrorString.indexOf("value-list") !== -1)
			iValueListErrorCount++;

		if (oErrors.hasOwnProperty(sErrorString)) {
			oErrors[sErrorString] = oErrors[sErrorString] + 1;
		} else {
			oErrors[sErrorString] = 1;
		}

		iTotalErrorCount++;

	}

	var oResultSet = document.getElementById("analyzer-analyze-resultset");

	oResultSet.innerText = "";
	oResultSet.innerHTML = "";

	oResultSet.innerText = "The count of auth issues is: " + iAuthErrorCount + "\n" +
		"The count of resource chip issues is: " + iChipErrorCount + "\n" +
		"The count of value-list issues is: " + iValueListErrorCount + "\n" +
		"Other issues are: " + (iTotalErrorCount - (iChipErrorCount + iAuthErrorCount + iValueListErrorCount)) + "\n" +
		"The total count of issues is: " + iTotalErrorCount + "\n"

	;

	oErrors = sortErrors(oErrors);
	console.log(oErrors);
	oResultSet.appendChild(tableCreate(oErrors));
}