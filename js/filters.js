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