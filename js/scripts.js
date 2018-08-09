// git test
var baseUrl = "http://localhost:4567";
var dataSourceLinkedPortalIds = [];   // storage for checked boxes, on DataSource / Portals modal form
var portalLinkedDataSourcesIds = [];  // storage for checked boxes, on Portal / DataSources modal form
var currentPortalLinkedDataSourcesIds = [];

var chartDate = new Date();

$(document).ready(function () {

    sendRequest('/portal', 'GET', null).then(function (data) {
        loadPortalsAcc(data, null);
    })

    sendRequest('/parentsource', 'GET', null).then(function (value) {
        loadDataSourceParentsAcc(value);
    });

    showDataSourcesTableAndAccordion("noFiltering");

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

        displayParentForm();
        loadParentFormData(dataSourceParentId);


// TODO -  BUG : Data Sources table not being display when click on Parent.  Need to click again.
//      -  need to put html code for DS table, in earlier (few more lines above...) ian

        $.get('templates/datasourcesTable.html', function (data) {
            $('#dataSourceTable').html(data);  // show data source table HTML code

            // get all data sources for the parent and load data table
            sendRequest('/parentsource/' + dataSourceParentId + '/data', 'GET', null).then(function (value) {
                loadDataSourcesTableData(value, "noFiltering");
            });
        });
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

//--------------  D A T A   S O U R C E  -------------------

    // click on row in Data Source table
    $(document).on('click', '.dataSourceRowName', function (e) {
        e.preventDefault();
        $('.btnDsChartFilter').addClass('d-none');        // add "hide" class - i.e. remove chart Filter button
        $('.btnDsTableFilter').addClass('d-none');        // add "hide" class - i.e. remove table Filter button
        var dataSourceId = $(this).data('data-source-id');
        var activeDataSource = 1;
        showDataSourcesFormAndPortalTable(dataSourceId, activeDataSource);
    });

    // click in Data Source Accordion list - display Data Source form and linked portals (Portals table)
    $(document).on('click', '#dataSourceLinkList a', function (e) {
       e.preventDefault();
       $('.btnDsChartFilter').addClass('d-none');         // add "hide" class - i.e. remove chart Filter button
       $('.btnDsTableFilter').addClass('d-none');         // add "hide" class - i.e. remove table Filter button
       $('.searchTextFilter').addClass('d-none');         // add "hide" Data Source table search-text filter
       $('#dsTableFilterSearchText').val("");             // reset filter search text
       $('#dsChartFilterSearchText').val("");             // reset filter search text

       var dataSourceId = $(this).data('data-source-id');
       var activeDataSource = 1;
       showDataSourcesFormAndPortalTable(dataSourceId, activeDataSource);
    });

     // click on "New Data Source" BUTTON -- Data Sources form   (add data source)
    $(document).on('click', '#btnDataSourceAdd', function (e) {
        displayDataSourceForm();
    });

    // hover -- highlight relevant Portals in accordion list
    $(document).on("mouseenter","#dataSourceLinkList a", function (event) {
        // rebuild accordion Portal list
        var dataSourceId = $(this).data('data-source-id');
        getAndLoadPortalsAcc(dataSourceId);
    });

    // SAVE button -- save data sources form
    $(document).on('click', '.btnDataSourceSave', function (e) {
       var dataSourceId =  $('#inputDataSourceId').val();
       var selectedParentSourceId   = $('#parentDataSourceDropDownList option:selected').val();
       var selectedUpdateIntervalId = $('#updateIntervalDropDownList option:selected').val();
       var selectedEwControllerId   = $('#ewControllerDropDownList option:selected').val();
       var selectedSourceTypeId     = $('#sourceTypeDropDownList option:selected').val();
       var selectedUpdateMethodId   = $('#updateMethodDropDownList option:selected').val();

       var inputNextUpdateLatestOld    = "";
       var inputLatestUpdateOld        = "";
       var inputTransferredToMasterOld = "";
       var inputProcessedUpdateOld     = "";
       var inputCommentsUpdateOld      = "";

       // check if ok to perform SAVE

       if (($('#inputDataSourceName').val() !== "")
           && (selectedEwControllerId       !== "")
           && (selectedUpdateIntervalId     !== "")
           && (selectedParentSourceId       !== "")) {

          // check whether all actions are completed (i.e. all dates have been entered)
          if    (($("#inputNextUpdateLatest").val()    !== "")
              && ($('#inputLatestUpdate').val()        !== "")
              && ($('#inputTransferredToMaster').val() !== "")
              && ($('#inputProcessedUpdate').val()     !== "")) {

                  // store this "Next Update"'s date values, for writing to history
                  inputNextUpdateLatestOld    = $('#inputNextUpdateLatest').val();         // "Next Update Due" date
                  inputLatestUpdateOld        = $('#inputLatestUpdate').val();             // "update received" date
                  inputTransferredToMasterOld = $('#inputTransferredToMaster').val();
                  inputProcessedUpdateOld     = $('#inputProcessedUpdate').val();
                  inputCommentsUpdateOld      = $('#inputCommentsUpdate').val();

                  var updateIntervalDaysIncrement = $('#updateIntervalDropDownList').find(':selected').attr('data-updateIntervalDaysIncrement')
                  setNextUpdateDateSuggestion($('#inputLatestUpdate').val(),updateIntervalDaysIncrement);

                // TODO -  add text to Alert message :      nextUpdateMsg = "Next Update due : " +

                  // empty the 3 x "action dates" fields and "update comment" field
                  $('#inputLatestUpdate').val("");
                  $('#inputTransferredToMaster').val("");
                  $('#inputProcessedUpdate').val("");
                  $('#inputCommentsUpdate').val("");
           };

          // TODO - look at dependancy / brother / sister / sub / feeder...
          var dependancyBrotherId = "";
              dependancySisterId  = "";
          if ($('#inputDependancyId').val() != null) {
             if ($('#inputUpdateMethod').val() == "manuell") {
                 dependancyBrotherId = $('#inputDependancyId').val();
             } else {
                 dependancySisterId = $('#inputDependancyId').val();
             }
          }

          var dataSourceObj = {
              dataSourceName:      $('#inputDataSourceName').val(),
              url:                 $('#inputUrl').val(),
              sourceType:          $('#inputSourceType').val(),
              comments:            $('#inputDsComments').val(),
              nextUpdateLatest:    $('#inputNextUpdateLatest').val(),
              latestUpdate:        $('#inputLatestUpdate').val(),
              transferredToMaster: $('#inputTransferredToMaster').val(),
              processedUpdate:     $('#inputProcessedUpdate').val(),
              commentsUpdate:      $('#inputCommentsUpdate').val(),
              deactivated:         $('#inputDeactivated').val()+"",
              wacheteUrl:          $('#inputWacheteUrl').val()+"",
              dependancyBrotherId: dependancyBrotherId,
              dependancySisterId:  dependancySisterId,
              parentId:            selectedParentSourceId,
              updateInterval:      selectedUpdateIntervalId,
              ewControllerId:      selectedEwControllerId,
              sourceType:          selectedSourceTypeId,
              updateMethod:        selectedUpdateMethodId,
          };

          if (dataSourceId == "") {
             // INSERT
             var endpoint = '/datasource',
                 method   = "POST";
          } else {
             // UPDATE
             var endpoint = '/datasource/put/' + dataSourceId,
                 method   = "POST";  // workaround for word "PUT" ("PUT" does not work)
          }
          // insert/update DataSources table for this item
          sendRequest(endpoint, method, dataSourceObj).then(function (value) {

              if (dataSourceId !== "") {

                  // update HistoryUpdates database table with this "Next Update", which is now the "most recent" / "active" update
                  if (inputNextUpdateLatestOld != "") {
                     var historyUpdateObj = {
                        dataSourceId:              dataSourceId,
                        nextUpdateDue:             inputNextUpdateLatestOld,
                        updateReceived:            inputLatestUpdateOld,
                        updateTransferredToMaster: inputTransferredToMasterOld,
                        updateProcessed:           inputProcessedUpdateOld,
                        updateComments:            inputCommentsUpdateOld
                     };
                     sendRequest('/historyupdates', 'POST', historyUpdateObj);
                  }

                  var currentPortalId;
                  // remove any unchecked Portals from the "Portals / Data Sources" xref table
                   for (var i = 0; i < currentDataSourceLinkedPortalIds.length ; i++) {
                      currentPortalId = currentDataSourceLinkedPortalIds[i];
                      if ($.inArray(currentPortalId, dataSourceLinkedPortalIds) == -1) {
                         // portal was unchecked - delete PortalSource (xref) item for this Data Source id
                         endpoint = "/portalsourcelink/delete/data/" + dataSourceId + "/" + currentPortalId;
                         method   = "POST";
                         sendRequest(endpoint, method, null);
                      };
                  };
              }

              if (dataSourceId == "") {dataSourceId = value.dataSourceId;};   // returned back, after having done SQL INSERT

              // add newly linked Portals to the "Portals / Data Sources" xref table
              for (var i = 0; i < dataSourceLinkedPortalIds.length ; i++) {
                  newPortalId = dataSourceLinkedPortalIds[i];
                  if ($.inArray(newPortalId, currentDataSourceLinkedPortalIds) == -1) {
                      // portal is newly checked - insert new PortalSource (xref) item for this Data Source id

                      var portalId = dataSourceLinkedPortalIds[i]   ;
                      var portalSourcesObj = {
                          portalId:          dataSourceLinkedPortalIds[i],
                          dataSourceId:      dataSourceId
                      };
                      var endpoint = '/portalsource',
                          method   = 'POST';                           // should be "INSERT", but not working
                      sendRequest(endpoint, method, portalSourcesObj); // INSERT to PortalSources xref data table
                   };
               };
               displayDataSourceForm();
               alert(dataSourceObj.dataSourceName + " saved successfully !");
               showDataSourcesTableAndAccordion("noFiltering");
          });

        } else {
           alert('CANNOT SAVE - please enter : (1) "Data Source Name", (2) "Parent", (3) "Interval" (4) "Early Warning Controller"');
        }
     });      // end of click on BUTTON - SAVE Data Sources

     // click on "Close" BUTTON -- Data Sources form
     $(document).on('click', '#btnDataSourceClose', function (e) {
          showDataSourcesTableAndAccordion("noFiltering");
     });

     // click on BUTTON -- "Link to Portals" (from Data Sources Form, shows modal form)
     $(document).on('click', '#btnDataSourceLinkToPortal', function (e) {

         var dataSourceName = $('#inputDataSourceName').val();

         // build HTML section, for portals checkbox form

         // get ALL Portals
         sendRequest('/portal', 'GET', null).then(function (value) {

             // get list of portals, build HTML code
             var htmlDataSection = '<ul>';
             for (var i = 0; i < value.length ; i++) {
                  var portalId = value[i].portalId;
                  htmlDataSection += '<li><input type="checkbox" value="' + portalId + '"';
                  if ($.inArray(portalId, dataSourceLinkedPortalIds) != -1) {
                     htmlDataSection += " checked";
                   }
                  htmlDataSection += '>' + value[i].portalName + '</li>';
             };
             htmlDataSection += '</ul>';
             $('#datasourceLinksToPortalsModal-title').html("Portals using Data Source\n\n : " + dataSourceName);
             $('#datasourceLinksToPortalsModal-body').html(htmlDataSection);    // insert HTML Portals modal form (checkboxes)
             $('#datasourceLinksToPortalsModal').modal('show');
          });
     });

     // click on BUTTON -- "Accept" on modal form : Link to Portal
     $(document).on('click', '#btnLinkToPortalAccept', function (e) {
         var boxes = $(":checkbox:checked")

         dataSourceLinkedPortalIds = [];
         var i = 0;
         $(boxes).each(function () {
             if (this.checked) {
                dataSourceLinkedPortalIds[i] = Number($(this).val());
                i=i+1;
             }
         });
     });

      // click on BUTTON -- "Deactivate Data Source"
      $(document).on('click', '#btnDataSourceDeactivate', function (e) {
          var dataSourceName = $('#inputDataSourceName').val();
          alert(dataSourceName + " will be de-activated.  Please click SAVE.");
          var todaysDate = getTodaysDate() ;
          $('#inputDeactivated').val(todaysDate);
      });

// TODO -- DEPENDANCIES
      // click on BUTTON -- "Dependencies"
        //      $(document).on('click', '#btnDependencies', function (e) {
        //          var dataSourceName = $('#inputDataSourceName').val();
        //
        //          select btnDependenciesloop thru, build 2 lists - dependent on / dependent for
        //          fill 2 html sections
        //
        //
        //      });





    // click on Checkbox in Data Sources form, to indicate "Latest Update received"
    $(document).on('click', '#inputLatestUpdateCheckbox', function (e) {
        var thisCheckBox = $(this);
        if (thisCheckBox.is (':checked')) {
            $('#inputLatestUpdate').val(getTodaysDate());  // set field to today's date
        } else {
           $('#inputLatestUpdate').val("");
        }
    });

    // click on Checkbox in Data Sources form, to indicate "Transferred to Master"
    $(document).on('click', '#inputTransferredToMasterCheckbox', function (e) {
        var thisCheckBox = $(this);
        if (thisCheckBox.is (':checked')) {
            $('#inputTransferredToMaster').val(getTodaysDate());  // set field to today's date
        } else {
           $('#inputTransferredToMaster').val("");
        }
    });

    // click on Checkbox in Data Sources form, to indicate "Update Processed"
    $(document).on('click', '#inputProcessedUpdateCheckbox', function (e) {
        var thisCheckBox = $(this);
        if (thisCheckBox.is (':checked')) {
            $('#inputProcessedUpdate').val(getTodaysDate());  // set field to today's date
        } else {
           $('#inputProcessedUpdate').val("");
        }
    });

    // click on BUTTON -- "URL" in Data Sources Form
    $(document).on('click', '#btnDsFormUrl', function (e) {
          var url = $('#inputUrl').val();
          if (url !== "") {window.open(url, '_blank');};
    });

    // click on BUTTON -- "URL" in Data Sources Form
    $(document).on('click', '#btnDsFormWacheteUrl', function (e) {
          var watcheUrl = $('#inputWacheteUrl').val();
          if (watcheUrl !== "") {window.open(watcheUrl, '_blank');};
    });

    // Click on "URL" -- button on Data Sources table row
    $(document).on('click', '.dsTableURL', function (e) {
         var url = $(this).data('url');
         if (url !== "") {window.open(url, '_blank');};
    });

    // Click on "Wachete" URL -- button on Data Sources table row
    $(document).on('click', '.dsTableWacheteUrl', function (e) {
         var wacheteUrl = $(this).data('wacheteurl');
         if (wacheteUrl !== "") {window.open(wacheteUrl, '_blank');};
    });


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

//--------------------  P R E V I O U S    U P D A T E S  ---------------------------

    // click on BUTTON -- "View Previous Updates" (modal form for history of Updates)
    $(document).on('click', '#btnDataSourceHistoryUpdates', function (e) {

        var dataSourceName = $('#inputDataSourceName').val();
        var dataSourceId   = $('#inputDataSourceId').val();

        // load data into History Updates modal form
        sendRequest('/historyupdates/list/' + dataSourceId, 'GET', null).then(function (value) {
            // build HTML code for list of previous updates for this Data Source

            var htmlDataSection = '<ul>';
            for (var i = 0; i < value.length ; i++) {
                 var portalId = value[i].portalId;

                 // htmlDataSection += '<td>' + value[i].updateExpectedEarliest + '</td>';
                 htmlDataSection += '<td>' + value[i].nextUpdateDue              + '</td>';
                 htmlDataSection += '<td>' + value[i].updateReceived             + '</td>';
                 htmlDataSection += '<td>' + value[i].updateTransferredToMaster  + '</td>';
                 htmlDataSection += '<td>' + value[i].updateProcessed            + '</td>';
                 htmlDataSection += '<td>' + value[i].updateComments             + '</td>';
                 htmlDataSection += '<td';
                 numberOfDaysLate = getDifferenceInDays(value[i].nextUpdateDue, value[i].updateReceived);
                 if (numberOfDaysLate < 0) {
                    htmlDataSection += ' class="overdue"';
                 }
                 if (numberOfDaysLate > 0) {
                    htmlDataSection += ' class="updatedOntime"';
                 }
                 htmlDataSection += ' rightAlign>' + numberOfDaysLate + '</td>';
                 htmlDataSection += '</tr>';
                 htmlDataSection += '</ul>';
            };
            $('#historyUpdatesModal-title').html(dataSourceName);
            $('#historyUpdatesModal-tablebody').html(htmlDataSection);    // insert HTML code to History Updates modal form
            $('#historyUpdatesModal').modal('show');
            showPreviousUpdatesChart();
        });
    });

    // click on BUTTON -- "Close" on modal form : History Updates
    $(document).on('click', '#btnHistoryUpdatesClose', function (e) {
       // anything to do ??      does automatic :  $('#mainModal').modal('hide');
    });

//---------------  D e a c t i v a t e   -----------------------------------

    // All "Deactivating" program program code can be deleted...


    $(document).on('click', '#btnDeactivatedDataSourceAccept', function (e) {
         var boxes = $(":checkbox:checked")
         var i = 0;
         $(boxes).each(function () {
             if (this.checked) {
                reactivatedDataSourceId = Number($(this).val());
                sendRequest('/datasource/activate/' + reactivatedDataSourceId, 'POST', null);
                i=i+1;
             }
         });

         alert("Now re-activated !");

         // display ALL Data Sources
         loadDataSourcesTableHtml();
         sendRequest('/datasource', 'GET', null).then(function (value) {
             loadDataSourcesTableData(value, "noFiltering");
         });
    });

    $(document).on('click', '#btnDeactivatedDataSourceClose', function (e) {
        loadDataSourcesTableHtml();
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "noFiltering");
        });
    });

    // click on row in Deactivated Data Source table
    $(document).on('click', '.deactivatedDataSourceTD', function (e) {
        e.preventDefault();
        var dataSourceId = $(this).data('data-source-id');
        var activeDataSource = 0;
        showDataSourcesFormAndPortalTable(dataSourceId, activeDataSource);
    });

// ---------   f i l t e r s  (main table)   --    i n s t a n t   e f f e c t   ------------------

    $(document).on('click', '.dataSourcesTableFilter .ewController', function (e) {
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "");
        });
    });

    $(document).on('click', '.dataSourcesTableFilter .updateInterval', function (e) {
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "");
        });
    });

    $(document).on('click', '.dataSourcesTableFilter .receivedButNotCompletedCheckbox', function (e) {
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "");
        });
    });

    $(document).on('click', '.dataSourcesTableFilter .wacheteSetupYesCheckbox', function (e) {
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "");
        });
    });

    $(document).on('click', '.dataSourcesTableFilter .wacheteSetupNoCheckbox', function (e) {
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "");
        });
    });

    $(document).on("keyup",".dsTableFilterSearchText", function(){
        sendRequest('/datasource', 'GET', null).then(function (value) {
            loadDataSourcesTableData(value, "");
        })
    });

// ---------   f i l t e r s  (chart)   --    i n s t a n t   e f f e c t   ------------------

    $(document).on("keyup",".dsChartFilterSearchText", function(){
        drawChart("nextUpdates",getTodaysDate());
    });

    // click on a "ewController" Checkbox in filter
    $(document).on('click', '.chartFilter .ewController', function (e) {
         drawChart("nextUpdates",getTodaysDate());
    });

    // click on a "update interval" Checkbox in filter
    $(document).on('click', '.chartFilter .updateInterval', function (e) {
         drawChart("nextUpdates",getTodaysDate());
    });

    $(document).on('click', '#decreaseMonthButton', function () {
        chartDate.setMonth(chartDate.getMonth() -1);
        drawChart("nextUpdates", chartDate.toISOString().slice(0, 10));
    });

    $(document).on('click', '#increaseMonthButton', function () {
        chartDate.setMonth(chartDate.getMonth() +1);
        drawChart("nextUpdates", chartDate.toISOString().slice(0, 10));
    });

//--------------  N A V I G A T I O N   B A R  ------------------

    // Click in "Tools" Drop Down list
    $(document).on('click', '#toolsNavLinkList a', function (e) {
          e.preventDefault();
          $('.btnDsChartFilter').addClass('d-none');       // add "hide" class - i.e. remove chart Filter button
          $('.btnDsTableFilter').addClass('d-none');       // add "hide" class - i.e. remove table Filter button

          var toolId = $(this).data('tool-id');
          switch(toolId) {
              case "addParentDataSource":
                    displayParentForm();
                    break;
              case "addDataSource":
                    displayDataSourceForm();
                    break;
              case "addPortal":
                    // get the portals's data and display Portal form
                    addNewPortal();
                    break;
              case "showDeactivatedDataSources":
                   // display Deactivated Data Sources form and load data
                   $.get('templates/deactivatedDataSourcesForm.html', function (data) {
                       $('#right-content-container').html(data);    // get and show HTML form
                       getAndLoadDeactivatedDataSources();          // get data values and show values in the form
                   });
                   break;
              default:
                break;
          }
    });


//--------------   G e n e r a l   -------------------

    $(document).on("mouseenter",".dataSourceRow", function (event) {
        // highlight Portals in accordion list

        // rebuild accordion Portal list, WITH highlighting
        var dataSourceId = $(this).data('data-source-id');
        getAndLoadPortalsAcc(dataSourceId);
    });

    $(document).on("mouseleave",".dataSourceRow", function (event) {
        // UNhighlight Portals in accordion list

        // rebuild accordion Portal list, WITHOUT highlighting
        sendRequest('/portal', 'GET', null).then(function (data) {
            loadPortalsAcc(data, null);
        })
    });

});                   // end of main "document.ready" function

//======================================================================
//==========  F U N C T I O N S  =======================================

function sendRequest(endpoint, method, data) {
    var encodedData = JSON.stringify(data);
//   console.log(method + ' ' + endpoint + '  ' + encodedData);

    return $.ajax({
        url:         baseUrl + endpoint,
        method:      method,
        data:        encodedData,
        dataType:   'json',
        crossDomain: true
    });
}

function setNextUpdateDateSuggestion(previousNextUpdateDate, updateIntervalDaysIncrement) {
   var suggestedNextUpdateDate = "";
   var previousNextDate        = new Date(previousNextUpdateDate);

   dateObj = new Date(previousNextDate);
   dateObj.setDate(previousNextDate.getDate() + Number(updateIntervalDaysIncrement));

   var dd   = dateObj.getDate() ;
       mm   = dateObj.getMonth()+1 ;
       yyyy = dateObj.getFullYear() ;
   if (dd<10) {dd='0'+dd;}
   if (mm<10) {mm='0'+mm;}

   $("#inputNextUpdateLatest").val(yyyy+'-'+mm+'-'+dd);  // suggestedNextUpdateDate;
}

function removeHighlightsPortalsAcc() {
    var htmlDataSection = '<ul id="portalLinkList">';
        overdueDataSource = "";

    for (var i = 0; i < data.length ; i++) {
        portalId = data[i].portalId;
        htmlDataSection += '<li';

//  TODO  --  NOT WORKING...   give red colour to text on Portals Ac column -- asynchronous problem...
//  set colour text to red for portals in ACC column if overdue
        // get all Data Sources for this portal

////--> TODO NOTE : for this unhighlighting function, will need to get/pass in "data" (DataSources) and use it for checking which data sources are overdue

        //   TODO --- NEED TO TEST when portals set up and have some overdue datasources
//        sendRequest('/portalsources/' + portalId + '/data', 'GET', null)
//        var j = 0;
//        while (j < value.length && overdue > 0) {
//          // if (value[j].latestUpdate = "") {
//          nextUpdateLatest = value[j].nextUpdateLatest;
//          overdue          = getDifferenceInDays(nextUpdateLatest);
//          if (overdue < 0) {
//             htmlDataSection += ' class="overdue"';
//          }
//          if (overdue == 0) {
//             htmlDataSection += ' class="dueToday"';
//          }
//          j++;
//        }

        htmlDataSection += '>' + '<a data-portal-id="' + portalId + '">' + data[i].portalName + '</li>'
    };
    htmlDataSection += '</ul>';
    $('#collapsePortal .card-body').html(htmlDataSection);
}

function drawChart(dataTypeToShow, monthYearToShow) {
    var monthNames = getMonthNames();  //(array : January, ...., December)
    var displayMonth = monthYearToShow.slice(5, 7);
    var displayYear  = monthYearToShow.slice(0, 4);
    var noUpdatesText = "";

    //---- Filtering - setup : build arrays, check values -----

    // - filter : get checked Early Warning controllers
    var ewControllerIds = [];
    $(".ewController:checked").each(function() {
        ewControllerIds.push($(this).val());
    });

    // - filter : get checked update intervals
    var updateIntervalIds = [];
    $(".updateInterval:checked").each(function() {
       updateIntervalIds.push($(this).val());
    });

    // filter : search text
    searchTextEntered = $('#dsChartFilterSearchText').val();
    console.log("m1 searchTextEntered='" + searchTextEntered + "'");

    if (dataTypeToShow = "nextUpdates") {
       sendRequest('/datasource', 'GET', null).then(function (value) {
           chartData    = [];
           chartDataSemi    = [];
           chartDataManual  = [];
           chartDataDefault = [];
           var j        = 0;

           for (var i = 0; i < value.length ; i++) {
               dataSourceName = value[i].dataSourceName;
               nextUpdate     = value[i].nextUpdateLatest;
               yyyy           = nextUpdate.slice(0, 4);
               mm             = nextUpdate.slice(5, 7);
               dd             = nextUpdate.slice(8, 10);    //(start day no.)
               dd++;
               ddd = dd ;                                   //(end day no.)       (to add 1 to dd, making ddd!!)
               dd--;

               // check that this "next update" has not been received, and is within the month required
               if ((value[i].latestUpdate == "") && (mm == displayMonth) && (yyyy == displayYear)) {

                   updateMethod     = value[i].updateMethod;
                   ewControllerId   = value[i].ewControllerId;
                   updateIntervalId = value[i].updateInterval;


                   if (($.inArray(ewControllerId, ewControllerIds) !== -1) && ($.inArray(updateIntervalId, updateIntervalIds) !== -1) &&
                       ((searchTextEntered == "") || ((searchTextEntered != "") && (value[i].dataSourceName.match(new RegExp(searchTextEntered, "i")) != null))))  {
                       // choose box colour based on Data Source's update method
                       switch (true) {
                          case (updateMethod == "1"):
                              // Automatic
                              var boxColor = "#62ee79";
                              break;
                          case (updateMethod == "2"):
                              // Semi-manual
                              var boxColor = "#8d8dae";
                              break;
                          case (updateMethod == "3"):
                              // Manual
                              var boxColor = "#ee4c5c";
                              break;
                          default:
                              var boxColor = "pink";
                              break;
                       }

                       var url = value[i].url;
                       chartData[j] = {
                           x: j,
                           y: [dd,ddd], label: dataSourceName, link:"http://bing.com/", color: boxColor,
                       };
                       j=j+1;
                   };
               };
           };
           var legendMonthName = monthNames[Number(displayMonth)-1];
           if (chartData == "") {noUpdatesText = "No updates expected in ";};
           var options = {
                   click: onClickChart,
                   animationEnabled: false,
                   exportEnabled: true,
                   title: {
                       text: monthNames[Number(displayMonth)-1] + ' ' + displayYear + ' : updates expected',
                       labelFontSize: 12,
                       fontSize: 26,
                   },
                   legend:{
                     fontSize: 18,
                    },
                   axisX: {
                       title: "",
                       interval: 1,
                       labelFontSize: 15,
                       labelWrap: false,
                   },
                   axisY: {
                       includeZero: false,
                       title: noUpdatesText + legendMonthName + " " + displayYear,
                       interval: 1,
                       suffix: "",
                       prefix: "",
                       labelWrap: false,
                       labelFontSize: 15,
                   },
               data: [{
                   type: "rangeBar",
                   showInLegend: false,
                   yValueFormatString: "",
                   indexLabel: "",
                   //legendText: "[Automatic,Semi-manual]",
                   //legendMarkerColor: "[green,blue]",
                   toolTipContent: "{label}",
                   dataPoints: chartData,
              }]
           };
        //   console.log("pp options = " + JSON.stringify(options)); // display object

           $("#chartBackForwardMonth").html(legendMonthName + " " + displayYear);
           console.log("legendMonthName=" + legendMonthName);
           $("#chartContainer").CanvasJSChart(options);
           $(".canvasjs-chart-credit").hide();  // remove "canvasjs.com" logo, below chart
       });
    };
}

function onClickChart(e){
        window.open("www.vg.no",'_blank');
};


function buildEwControllerCheckBoxControl() {

    // for filter - build HTML for Data Source Controller checkboxes (for table and chart)
    sendRequest('/ewcontrollers', 'GET', null).then(function (value) {
        var htmlDsControllerCheckBoxControlSection = '<li>';
        htmlDsControllerCheckBoxControlSection += 'Controller';
        htmlDsControllerCheckBoxControlSection += '<ul>';
        for (var i = 0; i < value.length ; i++) {
             var ewControllerName = value[i].ewControllerName;
             htmlDsControllerCheckBoxControlSection += '<li><input class="ewController" type="checkbox" checked value="' + value[i].ewControllerId + '">' + value[i].ewControllerName + '</li>';
        };
        htmlDsControllerCheckBoxControlSection += '</ul>';
        htmlDsControllerCheckBoxControlSection += '</li>';
        //var prevHtml = $('#EwControllerCheckBoxControl').html();
        $('.ewControllerCheckBoxControl').html(htmlDsControllerCheckBoxControlSection);  // display filter section
    });
}

function buildUpdateIntervalCheckBoxControl() {

    // for filter - build HTML for Update Interval checkboxes (for table and chart)

    sendRequest('/updateintervals', 'GET', null).then(function (value) {
        var htmlUpdateIntervalCheckBoxControlSection = '<li>';
        htmlUpdateIntervalCheckBoxControlSection += 'Interval';
        htmlUpdateIntervalCheckBoxControlSection += '<ul>';
        for (var i = 0; i < value.length ; i++) {
             var updateIntervalName = value[i].updateIntervalName;
             htmlUpdateIntervalCheckBoxControlSection += '<li><input class="updateInterval" type="checkbox" checked value="' + value[i].updateIntervalId + '">' + value[i].updateIntervalName + '</li>';
        };

        htmlUpdateIntervalCheckBoxControlSection += '</ul>';
        htmlUpdateIntervalCheckBoxControlSection += '</li>';
        $('.updateIntervalCheckBoxControl').html(htmlUpdateIntervalCheckBoxControlSection);  // display filter section
    });
}

/*function buildUpdateMethodCheckBoxControl() {

    // build HTML for Update Method checkboxes, for filter (for table and chart)
    sendRequest('/updatemethod', 'GET', null).then(function (value) {
        var htmlUpdateMethodCheckBoxControlSection = '<li>';
        htmlUpdateMethodCheckBoxControlSection += 'Update Method';
        htmlUpdateMethodCheckBoxControlSection += '<ul>';
        for (var i = 0; i < value.length ; i++) {
             var updateMethodName = value[i].updateMethodName;
             htmlUpdateMethodCheckBoxControlSection += '<li><input class="updateMethod" type="checkbox" checked value="' + value[i].updateMethodId + '">' + value[i].updateIntervalName + '</li>';
        };

        htmlUpdateMethodCheckBoxControlSection += '</ul>';
        htmlUpdateMethodCheckBoxControlSection += '</li>';
        $('.updateMethodCheckBoxControl').html(htmlUpdateMethodCheckBoxControlSection);  // display filter section
    });
}*/

function getMonthNames() {
    var monthNames = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
    return monthNames;
}

function getAndLoadDeactivatedDataSources() {

     // build HTML data body section
     sendRequest('/datasource/deactivated', 'GET', null).then(function (value) {

         // get list of portals, build HTML code
         if (value != "") {
             for (var i = 0; i < value.length ; i++) {
                 if (value[i].deactivated && value[i].deactivated.length > 0) {
                    buildStringTD(i, value);    // send in a fixed "i" value --  for asynchronous issue...
                 }
             };
         };
      });
 }

function buildStringTD(i, value) {
    sendRequest('/parentsource/' + value[i].parentId, 'GET', null).then(function (data) {
        var htmlDataSection = "<TR>";
        htmlDataSection += '<TD><input type="checkbox" value="' + value[i].dataSourceId + '"></input>';
        htmlDataSection += '<TD class="deactivatedDataSourceTD" data-data-source-id="' + value[i].dataSourceId + '">' + value[i].dataSourceName     + '</TD>';
        htmlDataSection += '<TD class="deactivatedDataSourceTD" data-data-source-id="' + value[i].dataSourceId + '">' + value[i].deactivated        + '</TD>';
        htmlDataSection += '<TD class="deactivatedDataSourceTD" data-data-source-id="' + value[i].dataSourceId + '">' + data.parentSourceName       + '</TD>';
        htmlDataSection += '<TD class="deactivatedDataSourceTD" data-data-source-id="' + value[i].dataSourceId + '">' + value[i].comments           + '</TD>';
        htmlDataSection += '</TR>';
        var prev = $('#deactivatedDataSourcesForm-tablebody').html();
        htmlDataSection = prev + htmlDataSection;
        $('#deactivatedDataSourcesForm-tablebody').html(htmlDataSection)
    });
}

function addNewPortal() {
    // add new Portal
    $.get('templates/portalsForm.html', function (data) {
       $('#right-content-container').html(data);
       $('#btnPortalDelete').addClass('d-none');    // remove delete button
       $("#btnPortalSave").prop("disabled", true);  // disable SAVE until all fields are entered
       $('#btnPortalAdd').addClass('d-none');
       buildEwControllerDropDownList(null);
    });
    portalLinkedDataSourcesIds = "";    // (reset, for Linked to Data Sources modal form)
}

function loadDataSourcesTableHtml() {
    $.get('templates/datasourcesTable.html', function (data) {
       $('#right-content-container').html(data);
    });
}

function loadParentFormData(dataSourceParentId) {
    sendRequest('/parentsource/' + dataSourceParentId, 'GET', null).then(function (value) {
            $('#inputParentSourceId').val(value.parentSourceId);
            $('#inputParentSourceName').val(value.parentSourceName);
            $('#inputParentSourceUrl').val(value.url);
            $('#btnParentSave').removeAttr('disabled');  // enable SAVE button
    });
}

function deletePortalSourcesByDataSourceId(dataSourceId) {

      // delete all PortalSource (xref) items for this Data Source id
      endpoint = "/portalsource/delete/data/" + dataSourceId;
      method   = "POST";
      sendRequest(endpoint, method, null);
}

function showAllDataSourcesTableForParent(dataSourceParentId) {
      loadDataSourcesTableHtml();
      // get all data sources for a parent
      sendRequest('/parentsource/' + dataSourceParentId + '/data', 'GET', null).then(function (value) {
          loadDataSourcesTableData(value, "noFiltering");
      });
}

//HIGHLIGHT Portals in Accordion, if any linked datasources are overdue
function showAndHighlightAccPortals(dataSourceParentId) {
    // get and re-display Portals accordion, showing highlighting all Portals used by this Parent Source
    // get Portal Sources ids, for all Parent sources' children (data sources)
    endpoint = "/portalsource/" + dataSourceParentId + "/parent";
    method   = "GET";

    sendRequest(endpoint, method, null).then (function (data) {
       // put portalIds for the parent, into array
       var highlightPortalIds = [];
       for (var i = 0; i < data.length ; i++) {
           portalId = data[i].portalId;
           highlightPortalIds[i] = portalId;
       }
       // reload Portal accordion, highlighting the Portals which use the Parent source
       sendRequest('/portal', 'GET', null).then(function (data) {
          loadPortalsAcc(data, highlightPortalIds);
       });
    });
}

function loadPortalsTableHtml() {
    $.get('templates/portalsTable.html', function (data) {
       $('#portalTable').html(data);
    });
}

function displayDataSourceForm() {
    $.get('templates/datasourcesForm.html', function (data) {
       $('#right-content-container').html(data);
       buildParentDropDownList(null);
       buildUpdateIntervalDropDownList(null);
       buildEwControllerDropDownList(null);
       buildSourceTypeDropDownList(null);
       buildUpdateMethodDropDownList(null);

       $('#btnDataSourceDelete').addClass('d-none');    // remove DELETE button
 //    $('#btnDataSourceAdd').addClass('d-none');       // remove NEW button
       dataSourceLinkedPortalIds = "";                  // reset, for "Link to Portals" modal form
    });
}

function displayParentForm() {
    $.get('templates/parentsForm.html', function (data) {
       $('#right-content-container').html(data);
       $('#btnParentDelete').addClass('d-none');       // remove DELETE button
    //    $('#btnParentAdd').addClass('d-none');       // remove NEW button
       $("#btnParentSave").prop("disabled", true);     // disable SAVE until all fields are entered
    });
}

function buildParentDropDownList(parentId) {
    var htmlDataSection  = '<div class="form-group row">';
        htmlDataSection += '<label for="parentList" class="col-sm-3">Data Source parent</label>';
        htmlDataSection += '<select id="parentList" col-sm-4 inputDataSourceChange>';

    if ((parentId == null) || (parentId == "")) {htmlDataSection += '<option value=""></option>'};  // make empty top item

    // get all Parent Sources
    sendRequest('/parentsource', 'GET', null).then(function (value) {
        for (var i = 0; i < value.length ; i++) {
           htmlDataSection += '<option';
           if (value[i].parentSourceId == parentId) {
              htmlDataSection += ' selected="selected"';
           }
           htmlDataSection += ' value="' + value[i].parentSourceId + '">' + value[i].parentSourceName + '</option>';  // value and text
        };
        htmlDataSection += '</select>';
        htmlDataSection += '</div>';
        $('#parentDataSourceDropDownList').html(htmlDataSection);
    });
}

function buildUpdateIntervalDropDownList(updateIntervalId) {
    var htmlDataSection  = '<div class="form-group row">';
        htmlDataSection += '<label for="updateIntervalList" class="col-sm-3">Update Interval</label>';
        htmlDataSection += '<select id="updateIntervalList" col-sm-4 inputDataSourceChange>';
    if ((updateIntervalId == null) || (updateIntervalId == "")) {htmlDataSection += '<option value=""></option>'};  // make empty top item

    // get all Update Intervals (from UpdateIntervals table)
    sendRequest('/updateintervals', 'GET', null).then(function (value) {
        for (var i = 0; i < value.length ; i++) {
           htmlDataSection += '<option';
           if (value[i].updateIntervalId == updateIntervalId) {
              htmlDataSection += ' selected="selected"';   // "check" the already chosen Update Interval
           }
           htmlDataSection += ' data-updateIntervalDaysIncrement="' + value[i].updateIntervalDaysIncrement + '" value="' + value[i].updateIntervalId + '">' + value[i].updateIntervalName + '</option>';  // value and text
        };
        htmlDataSection += '</select>';
        htmlDataSection += '</div>';
        $('#updateIntervalDropDownList').html(htmlDataSection);

        var updateIntervalDaysIncrement = $('#updateIntervalDropDownList').find(':selected').attr('data-updateIntervalDaysIncrement');  // need to assign here ??  Is not used or returned...
    });
}

function buildUpdateMethodDropDownList(updateMethodId) {
    var htmlDataSection  = '<div class="form-group row">';
        htmlDataSection += '<label for="updateMethodList" class="col-sm-3">Update Method</label>';
        htmlDataSection += '<select id="updateMethodList" col-sm-4 inputDataSourceChange>';
    if ((updateMethodId == null) || (updateMethodId == "")) {htmlDataSection += '<option value=""></option>'};  // make empty top item

    // get all Update Methods (from UpdateMethods table)
    sendRequest('/updatemethods', 'GET', null).then(function (value) {
        for (var i = 0; i < value.length ; i++) {
           htmlDataSection += '<option';
           if (value[i].updateMethodId == updateMethodId) {
              htmlDataSection += ' selected="selected"';   // "check" the already chosen Update Method
           }
           htmlDataSection += ' value="' + value[i].updateMethodId + '">' + value[i].updateMethodName + '</option>';  // value and text
        };
        htmlDataSection += '</select>';
        htmlDataSection += '</div>';
        $('#updateMethodDropDownList').html(htmlDataSection);
    });
}

function buildEwControllerDropDownList(ewControllerId) {
    // build drop-down list for Early Warning Controllers
    var htmlDataSection  = '<div class="form-group row">';
        htmlDataSection += '<label for="ewControllerList" class="col-md-3">EW Controllller</label>';
        htmlDataSection += '<select id="ewControllerList" col-md-4 inputDataSourceChange>';
    if ((ewControllerId == null) || (ewControllerId == "")) {htmlDataSection += '<option value=""></option>'};  // make empty top item

    // get all Early Warning Controllers (from EwControllers table)
    sendRequest('/ewcontrollers', 'GET', null).then(function (value) {
        for (var i = 0; i < value.length ; i++) {
           htmlDataSection += '<option';
           if (value[i].ewControllerId == ewControllerId) {
              htmlDataSection += ' selected="selected"';
           }
           htmlDataSection += ' value="' + value[i].ewControllerId + '">' + value[i].ewControllerName + '</option>';  // value and text
        };
        htmlDataSection += '</select>';
        htmlDataSection += '</div>';
        $('#ewControllerDropDownList').html(htmlDataSection);
    });
}

function buildSourceTypeDropDownList(sourceType) {
    // build drop-down list for Source Types (Excel, PDF etc)
    var htmlDataSection  = '<div class="form-group row">';
        htmlDataSection += '<label for="sourceTypeList" class="col-sm-3">SourceType</label>';
        htmlDataSection += '<select id="sourceTypeList" col-sm-4 inputDataSourceChange>';
    if ((sourceType == null) || (sourceType == "")) {htmlDataSection += '<option value=""></option>'};  // make empty top item

    // get all Source Types

    sendRequest('/sourcetypes', 'GET', null).then(function (value) {
        for (var i = 0; i < value.length ; i++) {
           htmlDataSection += '<option';
           if (value[i].sourceTypeId == sourceType) {
              htmlDataSection += ' selected="selected"';
           }
           htmlDataSection += ' value="' + value[i].sourceTypeId + '">' + value[i].sourceTypeName + '</option>';  // value and text
        };
        htmlDataSection += '</select>';
        htmlDataSection += '</div>';
        $('#sourceTypeDropDownList').html(htmlDataSection);
    });
}

function getAndLoadPortalsAcc(dataSourceId) {
    // get and highlight portals in Portals accordion, for 1 specific Data Source
    sendRequest('/portalsource/data/' + dataSourceId, 'GET', null).then(function (value) {
       var highlightPortalIds = [];
       for (var i = 0; i < value.length ; i++) {
           portalId = value[i].portalId;
           highlightPortalIds[i] = portalId;  // build array for using to highlight the Portals
       }
       // reload Portal accordion, highlighting Portals which use this table row's Data Source
       sendRequest('/portal', 'GET', null).then(function (data) {
          loadPortalsAcc(data, highlightPortalIds);
       });
    });
}

function showDataSourcesFormAndPortalTable(dataSourceId, activeDataSource) {

    // show Data Source form and fill with fields with data values
    $.get('templates/datasourcesForm.html', function (data) {
        $('#right-content-container').html(data);    // get and show HTML form
        getDataSourceContent(dataSourceId);          // get data values and show values in the form
    });
    loadPortalsTableHtml();                          // get and show HTML code for the Portals table

    // get Data Source data, and build drop-down-list controls
    sendRequest('/datasource/' + dataSourceId, 'GET', null).then(function (value) {
        buildParentDropDownList(value.parentId);               // build drop-down list for "Parent Source" field
        buildUpdateIntervalDropDownList(value.updateInterval); // build drop-down list for "Update Interval" field
        buildEwControllerDropDownList(value.ewControllerId);   // build drop-down list for "Early Warning Controller" field
        buildSourceTypeDropDownList(value.sourceType);         // build drop-down list for "Source Type" field
        buildUpdateMethodDropDownList(value.updateMethod);     // build drop-down list for "Update Method" field - Manual/Automatic/Semimanual
    });

    // get list of CURRENTLY linked-to portals for modal form
    sendRequest('/portalsource/data/' + dataSourceId, 'GET', null).then(function (value) {
        // make array, for portalIds, for checkboxes
        dataSourceLinkedPortalIds = [];
        for (var i = 0; i < value.length ; i++) {
            dataSourceLinkedPortalIds[i] = value[i].portalId;
        }
        currentDataSourceLinkedPortalIds = dataSourceLinkedPortalIds;  // make copy, for comparisson purposes, when saving
    });

    // show all portals for this data source
    loadPortalsTableHtml();           // get and show HTML code for the Portals table
    sendRequest('/datasource/' + dataSourceId + '/portals', 'GET', null).then(function (value) {
        loadPortalsTableData(value);
    });
};

//----------------- make Accordion column ---------------------

function loadPortalsAcc(data, highlightPortalIds) {
    var htmlDataSection = '<ul id="portalLinkList">';
        overdueDataSource = "";

    for (var i = 0; i < data.length ; i++) {
        portalId = data[i].portalId;
        htmlDataSection += '<li';

//  TODO  --  NOT WORKING...   give red colour to text on Portals Ac column -- asynchronous problem...   is doing this bit AFTER it executes the code further down
//  set colour text to red for portals in ACC column if overdue
        // get all Data Sources for this portal


        //   TODO --- NEED TO TEST when portals set up and have some overdue datasources

//        sendRequest('/portalsources/' + portalId + '/data', 'GET', null)
//        var j = 0;
//        while (j < value.length && overdue > 0) {
//          // if (value[j].latestUpdate = "") {
//          nextUpdateLatest = value[j].nextUpdateLatest;
//          overdue          = getDifferenceInDays(nextUpdateLatest);
//          if (overdue < 0) {
//             htmlDataSection += ' class="overdue"';
//          }
//          if (overdue == 0) {
//             htmlDataSection += ' class="dueToday"';
//          }
//          j++;
//        }

        if ($.inArray(portalId, highlightPortalIds) !== -1) {
           htmlDataSection += ' class="highlightPortal"';
        }
        htmlDataSection += '>' + '<a data-portal-id="' + portalId + '">' + data[i].portalName + '</li>'
    };
    htmlDataSection += '</ul>';
    $('#collapsePortal .card-body').html(htmlDataSection);
}

function showDataSourcesTableAndAccordion(filterType) {
    $('.btnDsChartFilter').addClass('d-none');      // add "hide" class - i.e. remove chart Filter button
    $('.btnDsTableFilter').removeClass('d-none');   // show table Filter button for Data Sources table
    loadDataSourcesAcc("");                         // show accordion for Data Sources
    loadDataSourcesTableHtml();                     // show table headings
    initialiseFiltersToAll();
    sendRequest('/datasource', 'GET', null).then(function (value) {
        loadDataSourcesTableData(value, filterType);  // show Data Source table data
    });
}

function initialiseFiltersToAll() {
    $('#dsTableFilterSearchText').val("");          // reset filter search text
    $('#dsChartFilterSearchText').val("");          // reset filter search text
    buildEwControllerCheckBoxControl();             // set all checkboxes to "checked"
    buildUpdateIntervalCheckBoxControl();           // set all checkboxes to "checked"
    $( "#receivedButNotCompleted" ).prop( "checked", false );  // uncheck filter for "Receuved but not completed"
}

function loadDataSourceParentsAcc(data) {
    var htmlDataSection = '<ul id="dataSourceParentLinkList">';
   // for (var i = data.length - 1; i >= 0; i--) {
     for (var i = 0; i < data.length ; i++) {
        htmlDataSection += '<li><a data-data-source-parent-id="' + data[i].parentSourceId + '" data-data-source-parent-name="' + data[i].parentSourceName + '">' + data[i].parentSourceName + '</li>'
    };
    htmlDataSection = htmlDataSection + '</ul>';
    $('#collapseDataSourceParent .card-body').html(htmlDataSection);
}

function loadDataSourcesAcc(dataSourceParentId) {

    // get all data sources for a parent, or all
    if (dataSourceParentId == "") {
        var endpoint = '/datasource';
    } else {
        var endpoint = '/parentsource/' + dataSourceParentId + '/data';
    };
    sendRequest(endpoint, 'GET', null).then(function (data) {

        var htmlDataSection = '<ul id="dataSourceLinkList">';
        var nextUpdateLatest = "";
        var overdue = "";

        for (var i = 0; i < data.length ; i++) {
            htmlDataSection      += '<li';
            nextUpdateLatest      = data[i].nextUpdateLatest;
            overdue               = getDifferenceInDays(nextUpdateLatest, getTodaysDate());
            latestUpdate          = data[i].latestUpdate;                // received date for latest update
            numberOfdaysAvailable = getDifferenceInDays(latestUpdate, getTodaysDate());
            if (numberOfdaysAvailable <= 0) {
               htmlDataSection += ' class="updateReceived"';
            }
            if (overdue < 0) {
               htmlDataSection += ' class="overdue"';
            }
            if (overdue == 0) {
               htmlDataSection += ' class="dueToday"';
            }
            htmlDataSection += '><a data-data-source-id="' + data[i].dataSourceId + '">' + data[i].dataSourceName + '</li>'
        };
        htmlDataSection = htmlDataSection + '</ul>';
        $('#collapseDataSource .card-body').html(htmlDataSection);
    });
}

function loadPortalsTableData(data) {
    // build Portals table HTML code

    var htmlDataSection = '';
    var ewIndex = "";

    for (var i = 0; i < data.length ; i++) {
        htmlDataSection += '<tr>';
        htmlDataSection += '<td>' + data[i].portalName + '</td>';
        htmlDataSection += '<td longTextReveal" ><input type="button" class="portalURL"  data-url="' + data[i].url + '" value="URL"</td>';
        htmlDataSection += '</tr>';
    };
    $('#portaltablebody').html(htmlDataSection);
}

function getDifferenceInDays(startDate, endDate) {

    var millisecondsPerDay = '';
    var millisBetween      = '';
    var numberOfdaysLate   = '';
    var warningColour      = '';
    var startDay           = new Date(startDate);
    var endDay             = new Date(endDate);

    millisecondsPerDay     = 1000 * 60 * 60 * 24;
    millisBetween          = startDay.getTime() - endDay.getTime();
    numberOfdaysDifference = millisBetween / millisecondsPerDay;
    return Number(numberOfdaysDifference);
}

function getTodaysDate() {
    var datetime = new Date() ;
        dd       = datetime.getDate() ;
        mm       = datetime.getMonth()+1 ;
        yyyy     = datetime.getFullYear() ;
    if (dd<10) {dd='0'+dd;}
    if (mm<10) {mm='0'+mm;}
    return yyyy+'-'+mm+'-'+dd ;
}

// Data Sources table data values
function loadDataSourcesTableData(data, filterType) {
    sendRequest('/historyupdates/alllastactive', 'GET', null).then(function (value) {
        // get all "active updates" dates, for all Data Sources

        //---- Filtering - setup : build arrays, check values -----

        // - filter : get checked Early Warning controllers
        var ewControllerIds = [];
        $(".ewController:checked").each(function() {
           ewControllerIds.push($(this).val());
        });

        // - filter : get checked update intervals
        var updateIntervalIds = [];
        $(".updateInterval:checked").each(function() {
           updateIntervalIds.push($(this).val());
        });

        // - filter : check if checked : Received But Not Completed Checkbox
        var receivedButNotCompletedFilterCheck = ($('#receivedButNotCompletedCheckbox').is(":checked") == true);    // checked ?  true / false

        // filter : search text
        searchTextEntered = $('#dsTableFilterSearchText').val();

        $('#datatablebody').html("");
        var htmlDataSection  = '';
            dangerClass      = '';
            parentIds        = [];
            dataSourceId     = "";
            nextUpdateDate   = "";
            alertColourClass = "";
            outputUrl        = "...";
            outputWacheteUrl = "...";
        for (var i = 0; i < data.length ; i++) {
            ewControllerId = data[i].ewControllerId;
            updateIntervalId = data[i].updateInterval.toString();

            if ((filterType == "noFiltering")
               || ($.inArray(ewControllerId, ewControllerIds) !== -1) &&
                ($.inArray(updateIntervalId, updateIntervalIds) !== -1) &&
              ((searchTextEntered == "") || ((searchTextEntered != "") && (data[i].dataSourceName.match(searchTextEntered,"/gi") != null))) &&
              ((receivedButNotCompletedFilterCheck == false || ((receivedButNotCompletedFilterCheck == true) && (data[i].latestUpdate != ""))))) {

                nextUpdateDate        = data[i].nextUpdateLatest;
                numberOfdaysLate      = getDifferenceInDays(nextUpdateDate, getTodaysDate());
                latestUpdate          = data[i].latestUpdate;                                      // received date for latest update
                numberOfdaysAvailable = getDifferenceInDays(latestUpdate, getTodaysDate());
                alertColourClass  = getAlertColour(numberOfdaysLate, numberOfdaysAvailable);       // set class variable for setting row colour
                dataSourceId = data[i].dataSourceId;

                htmlDataSection     = "<TR>";
                htmlDataSection    += '<tr class="dataSourceRow' + alertColourClass + '" data-data-source-id=' + data[i].dataSourceId +'>';
                htmlDataSection    += '<td class="dataSourceRowName" data-data-source-id="' + data[i].dataSourceId + '" style="word-wrap: break-word; vertical-align:middle">' + data[i].dataSourceName + '</td>';
                htmlDataSection    += '<td longTextReveal"><input type="button" class="dsTableURL" data-url="' + data[i].url + '" value="' + outputUrl + '"</td>';
                if (data[i].wacheteUrl.length > 1) {
                    htmlDataSection    += '<td longTextReveal"><input type="button" class="dsTableWacheteUrl" data-wacheteUrl="' + data[i].wacheteUrl + '" value="' + outputWacheteUrl + '"></td>';
                } else {
                    htmlDataSection    += '<td></td>';
                }
                htmlDataSection += '<td style="vertical-align:middle; overflow-wrap:break-word">' + data[i].nextUpdateLatest   + '</td>';
                htmlDataSection += '</tr>';
                var prev = $('#datatablebody').html();
                if (!prev)
                    prev = "";
                htmlDataSection = prev + htmlDataSection;
                $('#datatablebody').html(htmlDataSection);
            }
        };
    });
}

function getAlertColour(numberOfdaysLate, numberOfdaysAvailable) {
    var alertColourClass = '';
    switch (true) {
        case (numberOfdaysAvailable < -15):
            alertColourClass = " availableOver14Days";
            break;
       case (numberOfdaysAvailable < -7):
           alertColourClass = " availableOver7Days";
           break;
       case (numberOfdaysAvailable <= -3):
           alertColourClass = " availableOver3Days";
           break;
       case (numberOfdaysAvailable == -2):
           alertColourClass = " available2Days";
           break;
       case (numberOfdaysAvailable == -1):
           alertColourClass = " available1Day";
           break;
       case (numberOfdaysAvailable == 0):
           alertColourClass = " available0Day";
           break;
        case (numberOfdaysLate < -15):
            alertColourClass = " lateOver15days";
            break;
        case (numberOfdaysLate < -7):
            alertColourClass = " lateOver7days";
            break;
        case (numberOfdaysLate <= -3):
            alertColourClass = " lateOver3days";
            break;
        case (numberOfdaysLate == -2):
            alertColourClass = " late2days";
            break;
        case (numberOfdaysLate == -1):
            alertColourClass = " late1day";
            break;
        case (numberOfdaysLate == 0):
            alertColourClass = " late0day";
            break;
       default:
    }
    return alertColourClass;
}

function showPreviousUpdatesChart() {
    var dataSourceName = $('#inputDataSourceName').val();
    var dataSourceId   = $('#inputDataSourceId').val();

    // get History Updates data for this Data Source
    sendRequest('/historyupdates/list/' + dataSourceId, 'GET', null).then(function (value) {
        var dataSourceName = $('#inputDataSourceName').val();
        // build dataset for chart and display chart
        var historyData = [];
        for (var i = 0; i < value.length ; i++) {
            var receivedUpdateDate = value[i].updateReceived;
            var dd   = receivedUpdateDate.slice(8, 10);
            var mm   = receivedUpdateDate.slice(5, 7)-1;  //(subtract 1 from month)
            var yyyy = receivedUpdateDate.slice(0, 4);
            numberOfDaysLate = getDifferenceInDays(value[i].nextUpdateDue, value[i].updateReceived);
            if (numberOfDaysLate < 0) {
                 markerColour = 'red';
            } else {
                 markerColour = 'green';
            }
            historyData[i] = {
               x: new Date(yyyy, mm, dd),
               y: numberOfDaysLate, markerColor : markerColour
            }
        };

        var chart = new CanvasJS.Chart("chartContainerPreviousUpdates",  {
            title:{
                // text: dataSourceName + " : Previous updates",
                fontSize: 17,
                fontColor: "#2bafc6",
                font: "ariel",
            },
            legend: {fontSize: 10},
            // toolTipContent: "<b>{label}</b>: {y[0]} late}",

            axisX: {valueFormatString: "MMM",interlacedColor: "#deeff2", labelFontSize: 15},
            axisY:{labelFontSize: 15},
            height:200,
            width:750,
            data: [
               { markerSize: 15,
                 type: "line",
                 dataPoints: historyData,
               }
            ],
        });

        chart.render();

        $(".canvasjs-chart-credit").hide();  // remove "canvasjs.com" logo, below chart
        // remove "trial version" text....     does not work !
        $('.chartContainerPreviousUpdates').contents()
          .filter(function(){
              return this.nodeType === 3 && $.trim(this.nodeValue) !== '';
        }).remove();
    });
}

function getDataSourcesParentForTable() {
    sendRequest('/parentsource', 'GET', null).then(function(value) {
       $('.parent-name-cell').each(function() {
           var parentId = $(this).data('parent');
           for(var x = 0; x < value.length; x++) {
                if(value[x].parentSourceId == parentId) {
                  $(this).html(value[x].parentSourceName);
                }
           }
       });
    });
}

// ------------------ Portal manitenance form ------------------------

// get specific portal's data values for Portal maintenance form
function getPortalContent(portalId) {
    sendRequest('/portal/' + portalId, 'GET', null).then(function (value) {
        $('#inputPortalId').val(value.portalId);
        $('#inputPortalName').val(value.portalName);
        $('#inputPortalUrl').val(value.url);
        buildEwControllerDropDownList(value.ewControllerPortal); // build drop-down list for "Early Worning Controller"
    });
}

//-------------- Data Source manitenance form ------------------------

// get Data Source data values for 1 Data Source, for maintenance form
function getDataSourceContent(dataSourceId) {
    sendRequest('/datasource/' + dataSourceId, 'GET', null).then(function (value) {
        $('#inputDataSourceId').val(value.dataSourceId);
        $('#inputDataSourceName').val(value.dataSourceName);
        $('#inputUrl').val(value.url);
        $('#inputSourceType').val(value.sourceType);
        //$('#inputUpdateInterval').val(value.updateInterval);
        //$('#inputUpdateMethod').val(value.updateMethod);
        $('#inputDsComments').val(value.comments);

        $('#inputNextUpdateLatest').val(value.nextUpdateLatest);
        $('#inputLatestUpdate').val(value.latestUpdate);
        $('#inputTransferredToMaster').val(value.transferredToMaster);
        $('#inputProcessedUpdate').val(value.processedUpdate);

        sendRequest('/historyupdates/lastactiveupdate/' + dataSourceId, 'GET', null).then(function (value) {
            // --- get details of Latest Active Update received, from HistoryUpdates ---
            if (value != null) {
                $('#inputHistoryLatestUpdate').val(value.updateReceived);
                $('#inputHistoryProcessed').val(value.updateProcessed);
                $('#inputHistoryComments').val(value.updateComments);
            }
        });

        // change text colour of date, if update is overdue or is due in today
        numberOfdaysLate = getDifferenceInDays(value.nextUpdateLatest, getTodaysDate());   // overdue days
        if (numberOfdaysLate < 0) {
           $("#inputNextUpdateLatest").addClass("overdue");
        }
        if (numberOfdaysLate == 0) {
           $("#inputNextUpdateLatest").addClass("dueToday");
        }

     //   $('#inputParentId').val(value.parentId);
        var inputDependancyId = "";
        if (value.inputDependancyBrotherId == null) {
            inputDependancyId = $(value.inputDependancySisterId);
        } else {
            inputDependancyId = $(value.inputDependancyBrotherId);
        }
        $('#inputDependancyId').val(value.inputDependancyId);
        $('#inputCommentsUpdate').val(value.commentsUpdate);
        $('#inputWacheteUrl').val(value.wacheteUrl);
    })
}

//------------------------------------------------------------


// re-direct to another web-page
// window.location.href = 'http://www.example.com/';

// .hasClass()
