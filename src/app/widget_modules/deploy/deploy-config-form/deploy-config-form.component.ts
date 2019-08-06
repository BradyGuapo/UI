import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, from } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, take, tap } from 'rxjs/operators';
import { CollectorService } from 'src/app/shared/collector.service';
import { DashboardService } from 'src/app/shared/dashboard.service';
//import _ from 'lodash'; 
import * as _ from 'lodash';

@Component({
  selector: 'app-deploy-config-form',
  templateUrl: './deploy-config-form.component.html',
  styleUrls: ['./deploy-config-form.component.scss']
})
export class DeployConfigFormComponent implements OnInit {

  private widgetConfigId: string;
  private componentId: string;
 

  deployConfigForm: FormGroup;

  model: any;
  searching = false;             
  searchFailed = false;
  currentData: null;

  typeAheadResults: (text$: Observable<string>) => Observable<any>;

getDeploysCallback = (data) => {
    this.deployConfigForm.value.deployJob = data[0];
    console.log(this);
    this.deployConfigForm.get('deployJob').setValue(data[0]);
  }

  
  getDeployTitle = (deployJob: any) => {
    if (!deployJob) {
      return '';
    }
    return deployJob.name;
  }

  
  @Input()
  set widgetConfig(widgetConfig) {
    this.widgetConfigId = widgetConfig.options.id;
    
    if (widgetConfig.options.deployRegex !== undefined && widgetConfig.options.deployRegex !== null){
      this.deployConfigForm.get('deployRegex').setValue(widgetConfig.options.deployRegex);
    }
    if(widgetConfig.options.deployAggregateServer){
      this.deployConfigForm.get('deployAggregateServer').setValue(widgetConfig.options.deployAggregateServer);
    }
    else{
      this.deployConfigForm.get('deployAggregateServer').setValue(false);
    }
  }

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private collectorService: CollectorService,
    private dashboardService: DashboardService
  ) { 
    this.createForm();
  }

 
  

  ngOnInit() {
    this.typeAheadResults = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.searching = true),
        switchMap(term => {
          return term.length < 2 ? of([]) :
        from(this.getDeploymentJobs(term)) 
        }),
        tap(() => this.searching = false)
      );

    this.getDashboardComponent();
    this.loadSavedDeployment();
    
  }
  private createForm() {
    this.deployConfigForm = this.formBuilder.group({
      deployRegex: [''],
      deployJob: ['', Validators.required],
      deployAggregateServer: Boolean
    });
  }

  private getDeploymentJobs(filter){
    return this.getDeploymentJobsRecursive([],filter,null,0).then(this.processResponse)
  }

  
  
  private processResponse(data: any[]){
    var dataGrouped = _.chain(data[0])
                .groupBy(function(d)
                 { return ("" ) + d.options.applicationName + d.options.applicationId; })
                .map(function(d) { return d; }).value();

            var deploys = _.chain(dataGrouped).map(function(deploys, idx) {
            	var firstDeploy = deploys[0];
            	
            	var name = firstDeploy.options.applicationName;
            	var group = "";
            	var ids = new Array(deploys.length);
            	for (var i = 0; i < deploys.length; ++i) {
            		var deploy = deploys[i];
            		
            		ids[i] = deploy.id;
            		
            		if (i > 0) {
            			group += '\n';
            		}
            		group += ((deploy.niceName != null) && (deploy.niceName != "") ? deploy.niceName : deploy.collector.name) + " (" + deploy.options.instanceUrl + ")";
                }
            	
                return {
                    value: ids,
                    name: name,
                    group: group
                };
            }).value();
            
            return deploys;
    
  }
  

  private getDashboardComponent() {
    this.dashboardService.dashboardConfig$.pipe(take(1),
      map(dashboard => {
        return dashboard.application.components[0].id;
      })).subscribe(componentId => this.componentId = componentId);
  } 

  private submitForm() {
    const newConfig = {
      name: 'deploy',
      options: {
        id: this.widgetConfigId,
        deployRegex: this.deployConfigForm.value.deployRegex,
        deployAggregateServer: this.deployConfigForm.value.deployAggregateServer
      },
      componentId: this.componentId,
      collectorItemId: this.deployConfigForm.value.deployJob.id
    };
    this.activeModal.close(newConfig);
  }

  private getDeploymentJobsRecursive(arr: any[], filter, nameAndIdToCheck, pageNumber) {
     return this.collectorService.getItemsByType('deployment', {"search": filter, "size": 20, "sort": "description", "page": pageNumber}).toPromise().then(response => {
      //console.log('response', response);
      if (response.length > 0) {
        arr.push((response as any[]).filter(item => nameAndIdToCheck === null || nameAndIdToCheck === item.options.applicationName + "#" + item.options.applicationId));
        arr.push.apply(arr, _.chain(response).filter(function(d){
        return nameAndIdToCheck === null || nameAndIdToCheck === d.options.applicationName + "#" + d.options.applicationId;
      }).value());
     //console.log('after',arr);
      }
      
       if ( this.deployConfigForm.value.deployRegex && response.length > 0) {
        // The last item could have additional deployments with the same name but different servers
        var lastItem = response.slice(-1)[0];
        
        var checkKey = lastItem.options.applicationName  + "#" + lastItem.options.applicationId;
        if (nameAndIdToCheck === null || checkKey === nameAndIdToCheck) {
          // We should check to see if the next page has the same item for our grouping
          
          return this.getDeploymentJobsRecursive(arr, filter, checkKey, pageNumber + 1);
        }
      }
      return arr;
    });
  }
      private loadSavedDeployment(){
        this.dashboardService.dashboardConfig$.pipe(take(1),
      map(dashboard => {
        const deplopyCollector = dashboard.application.components[0].collectorItems.Deployment
        const savedCollectorDeploymentJob = deplopyCollector ? deplopyCollector[0].description : null
            if(savedCollectorDeploymentJob) { 
             this.getDeploymentJobs(savedCollectorDeploymentJob).then(this.getDeploysCallback)
            }
          })).subscribe();
}
}
