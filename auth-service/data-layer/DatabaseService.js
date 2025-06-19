class DatabaseService{
    constructor(){
        if (this.constructor === DatabaseService) {
            throw new Error("Cannot instantiate abstract class DatabaseService");
        }
    }

    async RegisterRestaurant(restaurantData) {
        throw new Error("Method 'RegisterRestaurant()' must be implemented.");
    }
    async RegisterClient(clientData) {
        throw new Error("Method 'RegisterClient()' must be implemented.");
    }
    async RegisterDeliveryPerson(deliveryData) {
        throw new Error("Method 'RegisterDeliveryPerson()' must be implemented.");
    }

}

export default DatabaseService;