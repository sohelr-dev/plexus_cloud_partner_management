<?php

namespace App\Models\Commission;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommissionPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'partner_commission_payments';

    protected $fillable = [
        'partner_id',
        'commission_id',
        'payment_date',
        'amount',
        'payment_method',
        'reference_number',
        'status',
        'created_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'payment_date' => 'date:Y-m-d',
    ];

    const METHODS   = ['Bank Transfer', 'Cheque', 'Cash', 'Mobile Banking', 'Other'];
    const STATUSES  = ['Pending', 'Paid', 'Failed'];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function commission()
    {
        return $this->belongsTo(PartnerCommission::class, 'commission_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
