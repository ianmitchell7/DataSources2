//--------------  P A R E N T  --------------------

// click in Accordion Data Source Parent list - display Data Source children (table) for this parent
    $(document).on('click', '#dataSourceParentLinkList a', function (e) {
        e.preventDefault();
        $('.btnDsChartFilter').addClass('d-none');        // add "hide" class - i.e. remove chart Filter button
        $('.btnDsTableFilter').addClass('d-none');        // add "hide" class - i.e. remove table Filter button

        $("#dataSourceParentLinkList a").removeClass("highlightParentClickAcc");
        $(this).addClass("highlightParentClickAcc");
        var dataSourceParentId   = $(this).data('data-source-parent-id');
        loadDataSourcesAcc(dataSourceParentId);

        displayParentForm(dataSourceParentId);
        loadParentFormData(dataSourceParentId);

        $("#dataSourceAccHeading").val("value","Hello world!").button("refresh");
     });

    // SAVE button -- save Parent form
    $(document).on('click', '#btnParentSave', function (e) {
        if ($('#inputParentSourceName').val() !== "") {
            var parentSourceId  = $('#inputParentSourceId').val();   // needed ??
            var parentSourceObj = {
                   parentSourceName: $('#inputParentSourceName').val(),
                   url:              $('#inputParentSourceUrl').val()
            };

            if (parentSourceId == "") {
                  // INSERT
                  var endpoint = '/parentsource',
                      method   = "POST";
            } else {
                  // UPDATE
                  var endpoint = '/parentsource/put/' + parentSourceId,
                      method   = "POST";  // workaround for word "PUT" ("PUT" does not work)
            }

            // save Parent Source data, then re-display Parent accordion
            sendRequest(endpoint, method, parentSourceObj).then(function (value) {
                alert(parentSourceObj.parentSourceName + " saved successfully");
                $.get('templates/parentsForm.html', function (data) {
                    $('#right-content-container').html(data);
                });
                // re-display Parent accordion column
                sendRequest('/parentsource', 'GET', null).then(function (value) {
                    loadDataSourceParentsAcc(value);
                });
            });
        } else {
            alert("CANNOT SAVE - please specify Parent Name");
        }
    });

    // enable / disable SAVE button
    $(document).on('keyup', '#inputParentSourceName', function() {
        if  (($('#inputParentSourceName').val() !== "") &&
            ($('#inputParentSourceUrl').val() !== "")) {
                $('#btnParentSave').removeAttr('disabled');  // enable SAVE button
        } else {
                $("#btnParentSave").prop("disabled", true);  // disable SAVE until all fields are entered
        }
    });
    $(document).on('keyup', '#inputParentSourceUrl', function() {
        if  (($('#inputParentSourceName').val() !== "") &&
            ($('#inputParentSourceUrl').val() !== "")) {
                $('#btnParentSave').removeAttr('disabled');  // enable SAVE button
        } else {
                $("#btnParentSave").prop("disabled", true);  // disable SAVE until all fields are entered
        }
        console.log("$('#inputParentSourceName').val() = " + $('#inputParentSourceName').val());
    });

    // Click on "Add New Parent" BUTTON -- "ADD" on Parent form
    $(document).on('click', '#btnParentAdd', function (e) {
        // re-display Parent data form
        $.get('templates/parentsForm.html', function (data) {
            $('#right-content-container').html(data);
        });
    });

    // Click on "Add new Data Source" BUTTON -- "ADD new Data Source" on Parent form
    $(document).on('click', '#btnParentAddDataSource', function (e) {
        // re-display Parent data form
        $.get('templates/parentsForm.html', function (data) {
            $('#right-content-container').html(data);
            displayDataSourceForm();
        });

    });

    // Click on "Close" BUTTON -- close Parent form
    $(document).on('click', '#btnParentClose', function (e) {
        // re-display Parent data form
        $.get('templates/parentsForm.html', function (data) {
            $('#right-content-container').html(data);
        });
    });

     $(document).on("mouseenter","#dataSourceParentLinkList a", function (event) {
         // hover -- highlight Portals in accordion list

         // rebuild accordion Portal list
         var parentSourceId = $(this).data('data-source-parent-id');
         showAndHighlightAccPortals(parentSourceId);       // show and highlight Accordion portals which are linked to selected Parent Source
     });

    $(document).on("mouseleave","#dataSourceParentLinkList a", function (event) {
       // $("#dataSourceParentLinkList a").removeClass("highlightParentClickAcc");
        $("#portalLinkList a").removeClass("highlightPortalClickAcc");
    });

    // Click on BUTTON - "Main View" on main Navigation row
    $(document).on('click', '#btnShowAllNextUpdates', function (e) {
        showDataSourcesTableAndAccordion("noFiltering");
    });

    // Click on "Data Source Table Filter" -- button on main Navigation row
    $(document).on('click', '#btnDsTableFilter', function (e) {
        $('.btnDsTableFilter').addClass('d-none');   // add "hide" class -- i.e. remove the Filter button
        initialiseFiltersToAll();

        // show filter options for Data Source table
        buildEwControllerCheckBoxControl();
        $('.dataSourcesTableFilter').removeClass('d-none');   // show filters
    });

    // Click on "Charts" -- button on main top Navigation bar
    $(document).on('click', '#btnShowNextUpdatesChart', function (e) {
        chartDate = new Date();

        $('.btnDsChartFilter').removeClass('d-none');    // remove "hide" class -- i.e. show the Filter button
        $('.btnDsTableFilter').addClass('d-none');       // hide Data Source "Table Filter" button

        $.get('templates/chart.html', function (data) {
            $('#right-content-container').html(data);    // show chart (HTML part)
        });

        $('#dsChartFilterSearchText').val("");        // reset filter search text

        // build HTML for Data Source Controller checkboxes, for filter (for table and chart)
        sendRequest('/ewcontrollers', 'GET', null).then(function (value) {
            var htmlDsControllerCheckBoxControlSection = '<li>';
            htmlDsControllerCheckBoxControlSection += 'Controller';
            htmlDsControllerCheckBoxControlSection += '<ul>';
            for (var i = 0; i < value.length ; i++) {
                 var ewControllerName = value[i].ewControllerName;
                 htmlDsControllerCheckBoxControlSection += '<li class="ml-3"><input class="ewController" type="checkbox" checked value="' + value[i].ewControllerId + '">' + value[i].ewControllerName + '</li>';
            };
            htmlDsControllerCheckBoxControlSection += '</ul>';
            htmlDsControllerCheckBoxControlSection += '</li>';
            $('.ewControllerCheckBoxControl').html(htmlDsControllerCheckBoxControlSection);  // display filter section

            // build HTML for Update Interval checkboxes, for filter (for table and chart)
            sendRequest('/updateintervals', 'GET', null).then(function (value) {
                var htmlUpdateIntervalCheckBoxControlSection = '<li>';
                htmlUpdateIntervalCheckBoxControlSection += 'Interval';
                htmlUpdateIntervalCheckBoxControlSection += '<ul>';
                for (var i = 0; i < value.length ; i++) {
                     var updateIntervalName = value[i].updateIntervalName;
                     htmlUpdateIntervalCheckBoxControlSection += '<li><input class="ml-3 updateInterval" type="checkbox" checked value="' + value[i].updateIntervalId + '">' + value[i].updateIntervalName + '</li>';
                };
                htmlUpdateIntervalCheckBoxControlSection += '</ul>';
                htmlUpdateIntervalCheckBoxControlSection += '</li>';
                $('.updateIntervalCheckBoxControl').html(htmlUpdateIntervalCheckBoxControlSection);  // display filter section

                drawChart("nextUpdates",getTodaysDate());
            });
         });
    });

    // Click on "Charts Filter" -- button on main Navigation row
    $(document).on('click', '#btnDsChartFilter', function (e) {
         $('.chartFilter').removeClass('d-none');          // remove "hide" class -- i.e. show the filters
         $('.btnDsChartFilter').addClass('d-none');        // remove "hide" class -- i.e. show the Filter button

         // show filter options for Data Source chart
         initialiseFiltersToAll();
    });