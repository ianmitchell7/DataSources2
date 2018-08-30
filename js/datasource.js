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
          var dependancyBrotherId = null;
              dependancySisterId  = null;
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
              wacheteUrl:          $('#inputWacheteUrl').val()+"",
              parentId:            selectedParentSourceId,
              updateInterval:      selectedUpdateIntervalId,
              ewControllerId:      selectedEwControllerId,
              sourceType:          selectedSourceTypeId,
              updateMethod:        selectedUpdateMethodId,

              // TODO -- Deactivated coding can be removed,
              // TODO -- Dependancy coding can be implemented
              //dependancyBrotherId: null,
              //dependancySisterId:  null,
              //deactivated:         null,    //deactivated:       $('#inputDeactivated').val()+"",
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
