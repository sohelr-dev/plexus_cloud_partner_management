<?php

namespace App\Models\SupportCenter;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerSupportCenterStaff extends Model
{
    use SoftDeletes;

    protected $table = 'partner_support_center_staff';

    protected $fillable = [
        'support_center_id',
        'staff_name',
        'staff_category',      // Branch Manager/Customer Service/Technical Staff/Sales Staff/Marketing Staff/Accounts Staff/Other Staff
        'designation',
        'contact_number',
        'email',
        'joining_date',
        'monthly_cost',
        'status',              // Active/Vacant/Resigned/Terminated
    ];

    protected $casts = [
        'joining_date' => 'date',
        'monthly_cost' => 'decimal:2',
    ];

    public function supportCenter(): BelongsTo
    {
        return $this->belongsTo(PartnerSupportCenter::class, 'support_center_id');
    }
}
