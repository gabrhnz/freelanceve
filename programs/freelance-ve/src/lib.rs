use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb");

#[program]
pub mod freelance_ve {
    use super::*;

    pub fn register_freelancer(
        ctx: Context<RegisterFreelancer>,
        nombre: String,
        bio: String,
        categoria: String,
        skills: Vec<String>,
    ) -> Result<()> {
        require!(nombre.len() <= 50, FreelanceError::NameTooLong);
        require!(bio.len() <= 200, FreelanceError::BioTooLong);

        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.owner.key();
        profile.nombre = nombre;
        profile.bio = bio;
        profile.categoria = categoria;
        profile.skills = skills;
        profile.jobs_completed = 0;
        profile.total_earned = 0;
        profile.rating = 0;
        profile.service_count = 0;
        profile.created_at = Clock::get()?.unix_timestamp;
        profile.bump = ctx.bumps.profile;

        Ok(())
    }

    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        nombre: String,
        bio: String,
        skills: Vec<String>,
    ) -> Result<()> {
        require!(nombre.len() <= 50, FreelanceError::NameTooLong);
        require!(bio.len() <= 200, FreelanceError::BioTooLong);

        let profile = &mut ctx.accounts.profile;
        require!(
            profile.owner == ctx.accounts.owner.key(),
            FreelanceError::Unauthorized
        );

        profile.nombre = nombre;
        profile.bio = bio;
        profile.skills = skills;

        Ok(())
    }

    pub fn create_service(
        ctx: Context<CreateService>,
        titulo: String,
        descripcion: String,
        precio_usdc: u64,
        delivery_days: u8,
        categoria: String,
    ) -> Result<()> {
        require!(precio_usdc >= 1_000_000, FreelanceError::PriceTooLow); // min 1 USDC
        require!(
            delivery_days >= 1 && delivery_days <= 30,
            FreelanceError::InvalidDeliveryDays
        );

        let profile = &mut ctx.accounts.profile;
        require!(
            profile.owner == ctx.accounts.owner.key(),
            FreelanceError::Unauthorized
        );

        let service = &mut ctx.accounts.service;
        service.freelancer = ctx.accounts.owner.key();
        service.titulo = titulo;
        service.descripcion = descripcion;
        service.precio_usdc = precio_usdc;
        service.delivery_days = delivery_days;
        service.categoria = categoria;
        service.activo = true;
        service.orders_count = 0;
        service.created_at = Clock::get()?.unix_timestamp;
        service.bump = ctx.bumps.service;

        profile.service_count = profile.service_count.checked_add(1).unwrap();

        Ok(())
    }

    pub fn toggle_service(ctx: Context<ToggleService>, activo: bool) -> Result<()> {
        let service = &mut ctx.accounts.service;
        require!(
            service.freelancer == ctx.accounts.owner.key(),
            FreelanceError::Unauthorized
        );
        service.activo = activo;
        Ok(())
    }

    pub fn place_order(ctx: Context<PlaceOrder>) -> Result<()> {
        let service = &ctx.accounts.service;
        require!(service.activo, FreelanceError::InvalidStatus);

        let now = Clock::get()?.unix_timestamp;
        let deadline = now + (service.delivery_days as i64) * 86400;

        let order = &mut ctx.accounts.order;
        order.client = ctx.accounts.client.key();
        order.freelancer = service.freelancer;
        order.service = ctx.accounts.service.key();
        order.amount = service.precio_usdc;
        order.status = OrderStatus::InProgress;
        order.deadline = deadline;
        order.created_at = now;
        order.bump = ctx.bumps.order;

        // Transfer USDC from client to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_usdc.to_account_info(),
            to: ctx.accounts.escrow_usdc.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, service.precio_usdc)?;

        // Increment service orders count
        let service_account = &mut ctx.accounts.service;
        service_account.orders_count = service_account.orders_count.checked_add(1).unwrap();

        Ok(())
    }

    pub fn deliver_order(ctx: Context<DeliverOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;
        require!(
            order.freelancer == ctx.accounts.freelancer.key(),
            FreelanceError::Unauthorized
        );
        require!(
            order.status == OrderStatus::InProgress,
            FreelanceError::InvalidStatus
        );
        order.status = OrderStatus::Delivered;
        Ok(())
    }

    pub fn approve_order(ctx: Context<ApproveOrder>) -> Result<()> {
        let order_bump = ctx.accounts.order.bump;
        let order_amount = ctx.accounts.order.amount;
        let order_key = ctx.accounts.order.key();

        let order = &mut ctx.accounts.order;
        require!(
            order.client == ctx.accounts.client.key(),
            FreelanceError::Unauthorized
        );
        require!(
            order.status == OrderStatus::Delivered,
            FreelanceError::InvalidStatus
        );

        // Release USDC from escrow to freelancer
        let seeds = &[
            b"escrow".as_ref(),
            order_key.as_ref(),
            &[order_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_usdc.to_account_info(),
            to: ctx.accounts.freelancer_usdc.to_account_info(),
            authority: ctx.accounts.escrow_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, order_amount)?;

        order.status = OrderStatus::Completed;

        let profile = &mut ctx.accounts.freelancer_profile;
        profile.jobs_completed = profile.jobs_completed.checked_add(1).unwrap();
        profile.total_earned = profile.total_earned.checked_add(order_amount).unwrap();

        Ok(())
    }

    pub fn refund_order(ctx: Context<RefundOrder>) -> Result<()> {
        let order_bump = ctx.accounts.order.bump;
        let order_amount = ctx.accounts.order.amount;
        let order_key = ctx.accounts.order.key();

        let order = &mut ctx.accounts.order;
        let now = Clock::get()?.unix_timestamp;

        require!(now > order.deadline, FreelanceError::DeadlineNotReached);
        require!(
            order.status == OrderStatus::InProgress || order.status == OrderStatus::Delivered,
            FreelanceError::InvalidStatus
        );

        // Refund USDC from escrow to client
        let seeds = &[
            b"escrow".as_ref(),
            order_key.as_ref(),
            &[order_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_usdc.to_account_info(),
            to: ctx.accounts.client_usdc.to_account_info(),
            authority: ctx.accounts.escrow_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, order_amount)?;

        order.status = OrderStatus::Refunded;

        Ok(())
    }
}

// ─── Accounts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RegisterFreelancer<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + FreelancerProfile::MAX_SIZE,
        seeds = [b"profile", owner.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, FreelancerProfile>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [b"profile", owner.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, FreelancerProfile>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateService<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + ServiceListing::MAX_SIZE,
        seeds = [b"service", owner.key().as_ref(), &profile.service_count.to_le_bytes()],
        bump
    )]
    pub service: Account<'info, ServiceListing>,
    #[account(
        mut,
        seeds = [b"profile", owner.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, FreelancerProfile>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ToggleService<'info> {
    #[account(mut)]
    pub service: Account<'info, ServiceListing>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + Order::MAX_SIZE,
        seeds = [b"order", service.key().as_ref(), &service.orders_count.to_le_bytes()],
        bump
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(mut)]
    pub service: Box<Account<'info, ServiceListing>>,
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(
        mut,
        constraint = client_usdc.owner == client.key(),
        constraint = client_usdc.mint == usdc_mint.key()
    )]
    pub client_usdc: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = client,
        token::mint = usdc_mint,
        token::authority = escrow_authority,
        seeds = [b"escrow_token", order.key().as_ref()],
        bump
    )]
    pub escrow_usdc: Box<Account<'info, TokenAccount>>,
    /// CHECK: PDA authority for escrow, seeds verified
    #[account(
        seeds = [b"escrow", order.key().as_ref()],
        bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,
    pub usdc_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DeliverOrder<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,
    pub freelancer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveOrder<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,
    #[account(
        mut,
        constraint = escrow_usdc.mint == freelancer_usdc.mint
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for escrow
    #[account(
        seeds = [b"escrow", order.key().as_ref()],
        bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = freelancer_usdc.owner == order.freelancer
    )]
    pub freelancer_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"profile", order.freelancer.as_ref()],
        bump = freelancer_profile.bump
    )]
    pub freelancer_profile: Account<'info, FreelancerProfile>,
    pub client: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundOrder<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,
    #[account(
        mut,
        constraint = escrow_usdc.mint == client_usdc.mint
    )]
    pub escrow_usdc: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for escrow
    #[account(
        seeds = [b"escrow", order.key().as_ref()],
        bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = client_usdc.owner == order.client
    )]
    pub client_usdc: Account<'info, TokenAccount>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ─── State ──────────────────────────────────────────────────────────────────

#[account]
pub struct FreelancerProfile {
    pub owner: Pubkey,        // 32
    pub nombre: String,       // 4 + 50
    pub bio: String,          // 4 + 200
    pub categoria: String,    // 4 + 50
    pub skills: Vec<String>,  // 4 + (4 + 30) * 5
    pub jobs_completed: u32,  // 4
    pub total_earned: u64,    // 8
    pub rating: u8,           // 1
    pub service_count: u32,   // 4
    pub created_at: i64,      // 8
    pub bump: u8,             // 1
}

impl FreelancerProfile {
    pub const MAX_SIZE: usize = 32 + (4 + 50) + (4 + 200) + (4 + 50) + (4 + (4 + 30) * 5) + 4 + 8 + 1 + 4 + 8 + 1;
}

#[account]
pub struct ServiceListing {
    pub freelancer: Pubkey,   // 32
    pub titulo: String,       // 4 + 100
    pub descripcion: String,  // 4 + 500
    pub precio_usdc: u64,     // 8
    pub delivery_days: u8,    // 1
    pub categoria: String,    // 4 + 50
    pub activo: bool,         // 1
    pub orders_count: u32,    // 4
    pub created_at: i64,      // 8
    pub bump: u8,             // 1
}

impl ServiceListing {
    pub const MAX_SIZE: usize = 32 + (4 + 100) + (4 + 500) + 8 + 1 + (4 + 50) + 1 + 4 + 8 + 1;
}

#[account]
pub struct Order {
    pub client: Pubkey,       // 32
    pub freelancer: Pubkey,   // 32
    pub service: Pubkey,      // 32
    pub amount: u64,          // 8
    pub status: OrderStatus,  // 1
    pub deadline: i64,        // 8
    pub created_at: i64,      // 8
    pub bump: u8,             // 1
}

impl Order {
    pub const MAX_SIZE: usize = 32 + 32 + 32 + 8 + 1 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OrderStatus {
    InProgress,
    Delivered,
    Completed,
    Refunded,
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum FreelanceError {
    #[msg("Invalid order status for this operation")]
    InvalidStatus,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("The deadline has not been reached yet")]
    DeadlineNotReached,
    #[msg("The deadline has already passed")]
    DeadlinePassed,
    #[msg("Price must be at least 1 USDC (1_000_000 micro-USDC)")]
    PriceTooLow,
    #[msg("Delivery days must be between 1 and 30")]
    InvalidDeliveryDays,
    #[msg("Name must be 50 characters or less")]
    NameTooLong,
    #[msg("Bio must be 200 characters or less")]
    BioTooLong,
}
