import DefaultExternalServiceApi from './externalService';

export default abstract class DefaultManagerProxy<ExternalService extends DefaultExternalServiceApi> {
    public service: ExternalService;

    constructor(externalService: ExternalService) {
        this.service = externalService;
    }
}
