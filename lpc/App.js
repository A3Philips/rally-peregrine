Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    _iterations: [],
    defaults: { padding: 10 },
    items: [
        {xtype:'container',itemId:'release_selector_box'},
        {xtype:'container',itemId:'chart_box'}
    ],
    launch: function() {
        this._addReleaseSelector();
    },
    _addReleaseSelector: function() {
        this._iterations = [];
        this.down('#release_selector_box').add({
            xtype:'rallyreleasecombobox',
            listeners: {
                scope: this,
                change: function(rb,new_value,old_value){
                    this.findIterationsBetweenDates(rb.getRecord().get(rb.getStartDateField()),rb.getRecord().get(rb.getEndDateField()));
                },
                ready: function(rb) {
                    this.findIterationsBetweenDates(rb.getRecord().get(rb.getStartDateField()),rb.getRecord().get(rb.getEndDateField()));
                }
            }
        });
    },
    findIterationsBetweenDates: function( start_date, end_date ) {
        this._log('Find iterations between ' + start_date + ' and ' + end_date );
        if ( this._chart ) { this._chart.destroy(); }
        // dates are given in JS, but we need them to be ISO
        var start_date_iso = Rally.util.DateTime.toIsoString(start_date);
        var end_date_iso = Rally.util.DateTime.toIsoString(end_date);
        
        var iteration_query = [
            {property:"StartDate",operator:">=",value:start_date_iso},
            {property:"EndDate",operator:"<=",value:end_date_iso}
        ];
        
        var iteration_store = Ext.create('Rally.data.WsapiDataStore',{
            model:'Iteration',
            autoLoad: true,
            filters: iteration_query,
            fetch:['Name','PlannedVelocity'],
            context: { projectScopeDown: false },
            listeners:{
                scope: this,
                load: function(store,records) {
                    this._iterations = records;
                    this._makeChart();
                }
            }
        });
    },
    _makeChart: function() {
        if (this._iterations.length == 0) {
            this._chart = this.down('#chart_box').add({
                xtype:'container',
                html:'No iterations defined in the release bounds...'
            });
        } else {
            var chart_hash = this._getSprintData();
            
            this._log(chart_hash);
            this._chart = this.down('#chart_box').add({
                xtype: 'rallychart',
                chartData: {
                    categories: chart_hash.Name,
                    series: [
                        {type:'line',data:chart_hash.CumulativePlannedVelocity,name:'Planned Velocity',visible:true}
                    ]
                },
                height: 350,
                chartConfig: {
                    chart: {},
                    title: {text:'LPC',align:'center'},
                    yAxis:[{title:{text:""}}]
                }
            });
        }
    },
    _getSprintData: function(){
        var data = {
            Name: [],
            PlannedVelocity: [],
            CumulativePlannedVelocity: []
        }
        var planned_velocity_adder = 0;
        Ext.Array.each(this._iterations,function(iteration){
            data.Name.push(iteration.get('Name'));
            var planned_velocity = iteration.get('PlannedVelocity') || 0;
            planned_velocity_adder += planned_velocity;
            
            data.PlannedVelocity.push(planned_velocity);
            data.CumulativePlannedVelocity.push(planned_velocity_adder);
        });
        return data;
    },

    _log: function(msg) {
        window.console && console.log(msg);
    }
});
