export interface IDeployResponse {
    result: IDeploy[];
    lastUpdated: number;
}

export interface IDeploy {
name : string;
url : string;
units : IUnits[];

}

export interface IUnits {
  name : string;
  version : number; 
  jobUrl : string;
  deployed : boolean;
  lastUpdated : number; // double lastnumber ???
  servers : IServers[];
}

export interface IServers {
  name : string;
  online : boolean;
}