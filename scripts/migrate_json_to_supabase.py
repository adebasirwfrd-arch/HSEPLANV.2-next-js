#!/usr/bin/env python3
"""
Supabase Migration Script for HSE Management System
Migrates OTP and Matrix data from JSON files to Supabase database.

Requirements:
    pip install supabase python-dotenv

Usage:
    python scripts/migrate_json_to_supabase.py

Environment Variables (in .env.local):
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
"""

import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env.local
dotenv_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(dotenv_path)

# Constants
MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

# Base paths
LIB_PATH = Path(__file__).parent.parent / 'lib'

# OTP JSON files mapping: (region, base) -> filename
OTP_FILES = {
    ('indonesia', 'narogong'): 'otp_indonesia_narogong.json',
    ('indonesia', 'duri'): 'otp_indonesia_duri.json',
    ('indonesia', 'balikpapan'): 'otp_indonesia_balikpapan.json',
    ('asia', 'all'): 'otp_asia_data.json',
}


def load_json_file(filename: str) -> dict:
    """Load and parse a JSON file from the lib directory."""
    filepath = LIB_PATH / filename
    if not filepath.exists():
        print(f"Warning: {filepath} not found")
        return {'year': 2026, 'programs': []}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_supabase_client() -> Client:
    """Initialize Supabase client with service role key (bypasses RLS)."""
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        print("Error: Missing environment variables!")
        print("Please ensure .env.local contains:")
        print("  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url")
        print("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        sys.exit(1)
    
    return create_client(url, key)


def upsert_program(supabase: Client, title: str, program_type: str, region: str, base: str, 
                   plan_type: str = None, due_date: str = None, reference_doc: str = None) -> int:
    """
    Insert or update a master program. Returns the program ID.
    Uses title + program_type + region + base as lookup key.
    """
    # Check if program exists
    result = supabase.table('master_programs').select('id').eq('title', title).eq(
        'program_type', program_type).eq('region', region).eq('base', base).execute()
    
    if result.data and len(result.data) > 0:
        # Update existing
        program_id = result.data[0]['id']
        supabase.table('master_programs').update({
            'plan_type': plan_type,
            'due_date': due_date,
            'reference_doc': reference_doc,
        }).eq('id', program_id).execute()
        return program_id
    else:
        # Insert new
        insert_result = supabase.table('master_programs').insert({
            'title': title,
            'program_type': program_type,
            'region': region,
            'base': base,
            'plan_type': plan_type,
            'due_date': due_date,
            'reference_doc': reference_doc,
        }).execute()
        return insert_result.data[0]['id']


def upsert_progress(supabase: Client, program_id: int, month: str, year: int, 
                    month_data: dict) -> None:
    """Insert or update monthly progress data."""
    plan_value = month_data.get('plan', 0)
    actual_value = month_data.get('actual', 0)
    
    # Determine status
    if actual_value >= plan_value and plan_value > 0:
        status = 'completed'
    elif actual_value > 0:
        status = 'in_progress'
    else:
        status = 'pending'
    
    # Check if progress exists
    result = supabase.table('program_progress').select('id').eq('program_id', program_id).eq(
        'month', month).eq('year', year).execute()
    
    progress_data = {
        'program_id': program_id,
        'month': month,
        'year': year,
        'plan_value': plan_value,
        'actual_value': actual_value,
        'wpts_id': month_data.get('wpts_id'),
        'plan_date': month_data.get('plan_date'),
        'impl_date': month_data.get('impl_date'),
        'pic_name': month_data.get('pic_name'),
        'pic_email': month_data.get('pic_email'),
        'pic_manager': month_data.get('pic_manager'),
        'pic_manager_email': month_data.get('pic_manager_email'),
        'evidence_url': month_data.get('evidence_url'),
        'status': status,
    }
    
    if result.data and len(result.data) > 0:
        # Update existing
        supabase.table('program_progress').update(progress_data).eq(
            'id', result.data[0]['id']).execute()
    else:
        # Insert new
        supabase.table('program_progress').insert(progress_data).execute()


def migrate_otp_data(supabase: Client) -> dict:
    """Migrate all OTP JSON files to Supabase."""
    stats = {'total': 0, 'by_region': {}}
    
    for (region, base), filename in OTP_FILES.items():
        print(f"\n📦 Loading {filename}...")
        data = load_json_file(filename)
        year = data.get('year', 2026)
        programs = data.get('programs', [])
        
        key = f"{region}_{base}"
        stats['by_region'][key] = 0
        
        for i, program in enumerate(programs, 1):
            title = program.get('name', f'Program {i}')
            plan_type = program.get('plan_type')
            due_date = program.get('due_date')
            months_data = program.get('months', {})
            
            try:
                # Upsert master program
                program_id = upsert_program(
                    supabase=supabase,
                    title=title,
                    program_type='otp',
                    region=region,
                    base=base,
                    plan_type=plan_type,
                    due_date=due_date
                )
                
                # Upsert monthly progress
                for month in MONTHS:
                    month_data = months_data.get(month, {'plan': 0, 'actual': 0})
                    upsert_progress(supabase, program_id, month, year, month_data)
                
                stats['by_region'][key] += 1
                stats['total'] += 1
                
                # Progress indicator
                if i % 10 == 0:
                    print(f"  Processed {i}/{len(programs)} programs...")
                    
            except Exception as e:
                print(f"  ❌ Error migrating '{title}': {e}")
        
        print(f"  ✅ Migrated {stats['by_region'][key]} programs from {filename}")
    
    return stats


def migrate_matrix_data(supabase: Client) -> dict:
    """Migrate Matrix data (audit, training, drill, meeting) - placeholder for future."""
    # TODO: Implement matrix data migration if needed
    print("\n⏭️  Matrix data migration not implemented yet")
    return {'total': 0}


def main():
    print("=" * 60)
    print("🚀 HSE Supabase Migration Script")
    print("=" * 60)
    
    # Initialize Supabase client with service role key
    print("\n🔑 Connecting to Supabase with Service Role Key...")
    supabase = get_supabase_client()
    print("   Connected!")
    
    # Migrate OTP data
    print("\n📋 Migrating OTP Data...")
    otp_stats = migrate_otp_data(supabase)
    
    # Migrate Matrix data (optional)
    # matrix_stats = migrate_matrix_data(supabase)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Migration Summary")
    print("=" * 60)
    print(f"Total OTP Programs: {otp_stats['total']}")
    for key, count in otp_stats.get('by_region', {}).items():
        print(f"  - {key}: {count} programs")
    print("\n✨ Migration complete!")


if __name__ == '__main__':
    main()
