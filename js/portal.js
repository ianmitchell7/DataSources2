//--------------  P O R T A L  -------------------

    // click in Accordion Portal list -- display Portal details + show all data sources
    $(document).on('click', '#portalLinkList a', function (e) {
        e.preventDefault();
        $('.btnDsChartFilter').addClass('d-none');       // add "hide" class - i.e. remove chart Filter button
        $('.btnDsTableFilter').addClass('d-none');       // add "hide" class - i.e. remove table Filter button

        $("#portalLinkList a").removeClass("highlightPortalClickAcc");
        $(this).addClass("highlightPortalClickAcc");

        // get the Portals's data and display form and data, then display Data Sources linked this Portal
        $.get('templates/portalsForm.html', function (data) {
            $('#right-content-container').html(data);
            getPortalContent(portalId);     // fill Portal form's data fields

            // get list of CURRENTLY linked-to Data Sources for modal form ppp
            currentPortalLinkedDataSourcesIds = [];  // stores current situation, as it is today
            portalLinkedDataSourcesIds        = [];  // working array, changes as user checks/unchecks boxes.  Contains list of new situation.

            sendRequest('/portalsource/portal/' + portalId, 'GET', null).then(function (value) {
                // make array, for dataSourcesIds, for checkboxes
                for (var i = 0; i < value.length ; i++) {
                    portalLinkedDataSourcesIds[i] = value[i].dataSourceId;
                }
                currentPortalLinkedDataSourcesIds = portalLinkedDataSourcesIds;  // make copy, for comparisson purposes, when saving
            });
            $.get('templates/datasourcesTable.html', function (data) {
                $('#dataSourceTable').html(data);  // get and show data source table HTML code
            });
        });

        var portalId = $(this).data('portal-id');
        var data     = "";
        // get all datasources for this portal and display table
        sendRequest('/portal/' + portalId + '/data', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "noFiltering");
        });
    });

    // SAVE button -- save Portal form
    $(document).on('click', '#btnPortalSave', function (e) {
        if ($('#inputPortalName').val() == "") {
           alert("CANNOT SAVE - Please specify the Portal Name");
        } else {
            var selectedEwControllerId = $('#ewControllerDropDownList option:selected').val();
            var portalId  =  $('#inputPortalId').val();
            var portalObj = {
                   portalName:         $('#inputPortalName').val(),
                   url:                $('#inputPortalUrl').val(),
                   ewControllerPortal: selectedEwControllerId
            };
            if (portalId == "") {
                  // INSERT
                  var endpoint = '/portal',
                      method   = "POST";
            } else {
                  // UPDATE
                  var endpoint = '/portal/put/' + portalId,
                      method   = "POST";  // workaround for word "PUT" ("PUT" does not work)
            }
            // save Portal data, then re-display Portal data form ppp
            sendRequest(endpoint, method, portalObj).then(function (value) {

                // remove any unchecked Data Sources from the "Portals / Data Sources" xref table
                for (var i = 0; i < currentPortalLinkedDataSourcesIds.length ; i++) {
                    currentDataSourcesId = currentPortalLinkedDataSourcesIds[i];
                    if ($.inArray(currentDataSourcesId, portalLinkedDataSourcesIds) == -1) {
                       // (data source was unchecked - delete PortalSource (xref) item for this Portal id)
                       endpoint = "/portalsourcelink/delete/data/" + currentDataSourcesId + "/" + portalId;
                       method   = "POST";
                       sendRequest(endpoint, method, null);
                    };
                };

                if (portalId == "") {portalId = value.portalId;};   // returned back, after having done INSERT

                // add newly linked Data Sources to the "Portals / Data Sources" xref table
                for (var i = 0; i < portalLinkedDataSourcesIds.length ; i++) {
                    newDataSourcesId = portalLinkedDataSourcesIds[i];
                    if ($.inArray(newDataSourcesId, currentPortalLinkedDataSourcesIds) == -1) {
                        // data source is newly checked - insert new PortalSource (xref) item for this Portal id

                        var dataSourcesId = portalLinkedDataSourcesIds[i];
                        var portalSourcesObj = {
                            portalId:          portalId,
                            dataSourceId:      portalLinkedDataSourcesIds[i],
                        };
                        var endpoint = '/portalsource',
                            method   = 'POST';                           // should be "INSERT", but not working
                        sendRequest(endpoint, method, portalSourcesObj); // INSERT to PortalSources xref data table
                    };
                };

                alert(portalObj.portalName + " saved successfully");
                $.get('templates/portalsForm.html', function (data) {
                    $('#right-content-container').html(data);
                    buildEwControllerDropDownList(null);
                    currentPortalLinkedDataSourcesIds = [];  // stores current situation, as it is today
                    portalLinkedDataSourcesIds        = [];  // working array, changes as user checks/unchecks boxes.  Contains list of new situation.
                    // re-display Portals accordion column
                    sendRequest('/portal', 'GET', null).then(function (data) {
                        loadPortalsAcc(data, null);
                    });
                });
            })
        }
    });

    // enable / disable SAVE button
    $(document).on('keyup', '#inputPortalName', function() {
        if  (($('#inputPortalName').val() !== "") &&
            ($('#inputPortalUrl').val() !== "")) {
                $('#btnPortalSave').removeAttr('disabled');  // enable SAVE button
        } else {
                $("#btnPortalSave").prop("disabled", true);  // disable SAVE until all fields are entered
        }
    });

    $(document).on('keyup', '#inputPortalUrl', function() {
        if  (($('#inputPortalName').val() !== "") &&
            ($('#inputPortalUrl').val() !== "")) {
                $('#btnPortalSave').removeAttr('disabled');  // enable SAVE button
        } else {
                $("#btnPortalSave").prop("disabled", true);  // disable SAVE until all fields are entered
        }
    });

    // Click on "Close" BUTTON -- close Portal form
    $(document).on('click', '#btnPortalClose', function (e) {
        // re-display Portal data form
        $.get('templates/portalsForm.html', function (data) {
            $('#right-content-container').html(data);
        });
    });

    // Click on "URL" -- button on Data Sources table row
    $(document).on('click', '.portalURL', function (e) {
         var url = $(this).data('url');
         if (url !== "") {window.open(url, '_blank');};
    });

    $(document).on('click', '#btnPortalAdd', function (e) {
       addNewPortal();
    });

    // click on BUTTON -- "Link to Data Sources" (from Portal form, shows modal form)
    $(document).on('click', '#btnPortalsLinkToDataSources', function (e) {

        var portalName = $('#inputPortalName').val();

        // build HTML section, for Data Sources checkbox modal form

        // get ALL Data Sources
        sendRequest('/datasource', 'GET', null).then(function (value) {

            // get list of Data Sources, build HTML code
            var htmlDataSection = '<ul>';
            for (var i = 0; i < value.length ; i++) {
                 var dataSourceId = value[i].dataSourceId;
                 htmlDataSection += '<li><input type="checkbox" value="' + dataSourceId + '"';
                 if ($.inArray(dataSourceId, portalLinkedDataSourcesIds) != -1) {
                    htmlDataSection += " checked";
                 }
                 htmlDataSection += '>' + value[i].dataSourceName + '</li>';
            };
            htmlDataSection += '</ul>';
            $('#portalLinksToDataSourcesModal-title').html("Data Sources used by Portal\n\n : " + portalName);
            $('#portalLinksToDataSourcesModal-body').html(htmlDataSection);    // insert HTML Data Sources modal form (checkboxes)
            $('#portalLinksToDataSourcesModal').modal('show');
        });
    });

    // click on BUTTON -- "URL" in Data Sources Form
    $(document).on('click', '#btnPortalFormUrl', function (e) {
          var url = $('#inputPortalUrl').val();
          if (url !== "") {window.open(url, '_blank');};
    });

     // click on BUTTON -- "Accept" on modal form : Link to Data Sources
     $(document).on('click', '#btnLinkToDataSourcesAccept', function (e) {
         var boxes = $(":checkbox:checked")

         portalLinkedDataSourcesIds = [];
         var i = 0;
         $(boxes).each(function () {
             if (this.checked) {
                portalLinkedDataSourcesIds[i] = Number($(this).val());
                i=i+1;
             }
         });
     });