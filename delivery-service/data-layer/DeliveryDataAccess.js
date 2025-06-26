import prisma from '../src/config/dbConnection.js';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import DatabaseService from './DatabaseService.js';
import crypto from 'crypto';

class DeliveryDataAccess extends DatabaseService {
    constructor() {
        super();
        this.prisma = prisma;
    }

    async RegisterDeliveryPerson(deliveryPersonData) {
        const { firstName, lastName, email, password, role } = deliveryPersonData;
        
        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const newUser = await this.prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: passwordHash,
                    role,
                },
            });
            
            return newUser;
        } catch (error) {
            console.error("Error registering delivery person:", error);
            throw error;
        }
    }

    async getAvailableOrdersForDelivery() {
        try {
            const orders = await this.prisma.order.findMany({
                where: {
                    status: 'CONFIRMED',
                    deliveryPersonId: null
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    restaurant: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    orderItems: {
                        include: {
                            item: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    },
                    orderMenus: {
                        include: {
                            menu: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    timestamp: 'asc' // Oldest orders first
                }
            });
            
            return orders;
        } catch (error) {
            console.error("Error getting available orders for delivery:", error);
            throw error;
        }
    }

    async acceptDeliveryOrder(deliveryPersonId, orderId) {
        try {
            // Generate QR code and confirmation code
            const qrCode = crypto.randomBytes(16).toString('hex');
            const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

            const result = await this.prisma.$transaction(async (tx) => {
                // Check if order is still available
                const order = await tx.order.findFirst({
                    where: {
                        id: orderId,
                        status: 'CONFIRMED',
                        deliveryPersonId: null
                    }
                });

                if (!order) {
                    throw new Error('Order not available for delivery or already assigned');
                }

                // Update order with delivery person and codes
                const updatedOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        deliveryPersonId: deliveryPersonId,
                        status: 'ACCEPTED_BY_DELIVERY',
                        qrCode: qrCode,
                        confirmationCode: confirmationCode
                    },
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        restaurant: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Create delivery record
                const delivery = await tx.delivery.create({
                    data: {
                        orderId: orderId,
                        deliveryPersonId: deliveryPersonId,
                        status: 'ASSIGNED'
                    }
                });

                return { order: updatedOrder, delivery };
            });

            return result;
        } catch (error) {
            console.error("Error accepting delivery order:", error);
            throw error;
        }
    }

    async updateOrderStatusAfterQRScan(deliveryPersonId, orderId, qrCodeData) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // Verify order and QR code
                const order = await tx.order.findFirst({
                    where: {
                        id: orderId,
                        deliveryPersonId: deliveryPersonId,
                        status: 'ACCEPTED_BY_DELIVERY'
                    }
                });

                if (!order) {
                    throw new Error('Order not found or not assigned to this delivery person');
                }

                // Verify QR code
                if (order.qrCode !== qrCodeData) {
                    throw new Error('Invalid QR code for this order');
                }

                // Update order status
                const updatedOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'PICKED_UP',
                        pickedUpAt: new Date()
                    },
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        restaurant: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Update delivery record
                await tx.delivery.update({
                    where: { orderId: orderId },
                    data: {
                        status: 'PICKED_UP',
                        pickedUpAt: new Date()
                    }
                });

                return updatedOrder;
            });

            return result;
        } catch (error) {
            console.error("Error updating order status after QR scan:", error);
            throw error;
        }
    }

    async confirmDeliveryWithClientCode(deliveryPersonId, orderId, confirmationCode) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // Get order with confirmation code
                const order = await tx.order.findFirst({
                    where: {
                        id: orderId,
                        deliveryPersonId: deliveryPersonId,
                        status: 'PICKED_UP'
                    }
                });

                if (!order) {
                    throw new Error('Order not found or not in correct status');
                }

                // Verify confirmation code
                if (order.confirmationCode !== confirmationCode) {
                    throw new Error('Invalid confirmation code');
                }

                // Update order status
                const updatedOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'DELIVERED',
                        deliveredAt: new Date()
                    },
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        restaurant: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Update delivery record
                await tx.delivery.update({
                    where: { orderId: orderId },
                    data: {
                        status: 'DELIVERED',
                        deliveredAt: new Date()
                    }
                });

                return updatedOrder;
            });

            return result;
        } catch (error) {
            console.error("Error confirming delivery with client code:", error);
            throw error;
        }
    }

    async getDeliveryPersonOrders(deliveryPersonId) {
        try {
            const orders = await this.prisma.order.findMany({
                where: {
                    deliveryPersonId: deliveryPersonId
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    restaurant: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    orderItems: {
                        include: {
                            item: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    },
                    orderMenus: {
                        include: {
                            menu: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    },
                    deliveries: true
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });
            
            return orders;
        } catch (error) {
            console.error("Error getting delivery person orders:", error);
            throw error;
        }
    }

    async getDeliveryStats(deliveryPersonId, options = {}) {
        try {
            const { dateFrom, dateTo } = options;
            
            const whereClause = {
                deliveryPersonId: deliveryPersonId
            };

            if (dateFrom || dateTo) {
                whereClause.timestamp = {};
                if (dateFrom) whereClause.timestamp.gte = new Date(dateFrom);
                if (dateTo) whereClause.timestamp.lte = new Date(dateTo);
            }

            const [totalOrders, completedOrders, cancelledOrders, avgDeliveryTime] = await Promise.all([
                // Total orders
                this.prisma.order.count({
                    where: whereClause
                }),
                
                // Completed orders
                this.prisma.order.count({
                    where: {
                        ...whereClause,
                        status: 'DELIVERED'
                    }
                }),
                
                // Cancelled orders
                this.prisma.order.count({
                    where: {
                        ...whereClause,
                        status: 'CANCELLED'
                    }
                }),
                
                // Average delivery time
                this.prisma.order.aggregate({
                    where: {
                        ...whereClause,
                        status: 'DELIVERED',
                        pickedUpAt: { not: null },
                        deliveredAt: { not: null }
                    },
                    _avg: {
                        // This would need a computed field, for now return null
                    }
                })
            ]);

            return {
                totalOrders,
                completedOrders,
                cancelledOrders,
                pendingOrders: totalOrders - completedOrders - cancelledOrders,
                completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error("Error getting delivery stats:", error);
            throw error;
        }
    }
}

export default DeliveryDataAccess;
