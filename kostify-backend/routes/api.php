<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Api\TenantController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/owner/login', [AuthController::class, 'ownerLogin']);
Route::post('/tenant/login', [AuthController::class, 'tenantLogin']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
       
    //route super admin
        Route::get(
                '/super-admin/overview',
                [SuperAdminController::class, 'overview']
        );
        Route::get(
                '/super-admin/owners',
                [SuperAdminController::class, 'owners']
        );
        Route::post('/super-admin/owners', [SuperAdminController::class, 'storeOwner']);
        Route::put(
            '/super-admin/owners/{id}/status',
            [SuperAdminController::class, 'updateOwnerStatus']
        );
        Route::delete(
            '/super-admin/owners/{id}',
            [SuperAdminController::class, 'deleteOwner']
        );
        Route::get(
            '/super-admin/kosts',
            [SuperAdminController::class, 'kosts']
        );
        Route::post(
            '/super-admin/kosts',
            [SuperAdminController::class, 'storeKost']
        );
        Route::put(
            '/super-admin/kosts/{id}',
            [SuperAdminController::class, 'updateKost']
        );

        Route::delete(
            '/super-admin/kosts/{id}',
            [SuperAdminController::class, 'deleteKost']
        );
        Route::get(
            '/super-admin/monitoring/owners',
            [SuperAdminController::class, 'monitoringOwners']
        );
        Route::get(
            '/super-admin/monitoring/kosts',
            [SuperAdminController::class, 'monitoringKosts']
        );

    //route ownerr
        Route::get(
            '/owner/overview',
            [OwnerController::class, 'overview']
        );
        Route::get(
            '/owner/rooms',
            [OwnerController::class, 'rooms']
        );
        Route::post(
            '/owner/rooms',
            [OwnerController::class, 'storeRoom']
        );
        Route::put(
            '/owner/rooms/{id}',
            [OwnerController::class, 'updateRoom']
        );
        Route::delete(
            '/owner/rooms/{id}',
            [OwnerController::class, 'deleteRoom']
        );
        Route::get(
            '/owner/tenants',
            [OwnerController::class, 'tenants']
        );
        Route::post(
            '/owner/tenants',
            [OwnerController::class, 'storeTenant']
        );
        Route::put('/owner/tenants/{id}', [OwnerController::class, 'updateTenant']);
        Route::post('/owner/bills', [OwnerController::class, 'storeBill']);
        Route::get('/owner/bills', [OwnerController::class, 'bills']);
        Route::put('/owner/bills/{id}/status', [OwnerController::class, 'updateBillStatus']);
        Route::post('/owner/bills/{id}/reminder', [OwnerController::class, 'sendBillReminder']);
        Route::get('/owner/complaints', [OwnerController::class, 'complaints']);

    //route anak kost
        Route::get('/tenant/bills', [TenantController::class, 'bills']);
        Route::post(
            '/tenant/bills/{id}/payment',
            [TenantController::class, 'uploadPaymentProof']
        );
        Route::post(
            '/tenant/complaints',
            [TenantController::class, 'storeComplaint']
        );
        Route::post('/tenant/fcm-token', [TenantController::class, 'saveFcmToken']);
    });

