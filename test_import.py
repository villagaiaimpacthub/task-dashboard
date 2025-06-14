#!/usr/bin/env python3
"""Test script to debug import API"""

import asyncio
import aiohttp
import json

async def test_import():
    # Login first
    login_data = {
        "email": "alice@hive.com",
        "password": "password123"
    }
    
    async with aiohttp.ClientSession() as session:
        # Login
        async with session.post('http://localhost:8000/api/v1/auth/login', json=login_data) as resp:
            if resp.status != 200:
                print(f"Login failed: {resp.status}")
                text = await resp.text()
                print(text)
                return
            
            login_response = await resp.json()
            token = login_response['access_token']
            print(f"Login successful, token: {token[:20]}...")
        
        # Test master plan content
        test_content = """# Test Master Plan

### Project: Test Project
This is a test project

#### Task: Test Task
This is a test task

**Dependencies:** None
**Required Skills:** Testing
**Estimated Hours:** 2-4 hours
"""
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Parse master plan
        parse_data = {
            "content": test_content,
            "format": "markdown"
        }
        
        async with session.post('http://localhost:8000/api/v1/import/master-plan', 
                               json=parse_data, headers=headers) as resp:
            if resp.status != 200:
                print(f"Parse failed: {resp.status}")
                text = await resp.text()
                print(text)
                return
            
            parse_response = await resp.json()
            print("Parse successful!")
            print(f"Projects: {len(parse_response['preview']['projects'])}")
            print(f"Tasks: {len(parse_response['preview']['tasks'])}")
        
        # Import the data
        import_data = {
            "preview_data": parse_response['preview']
        }
        
        async with session.post('http://localhost:8000/api/v1/import/confirm',
                               json=import_data, headers=headers) as resp:
            if resp.status != 200:
                print(f"Import failed: {resp.status}")
                text = await resp.text()
                print(text)
                return
            
            import_response = await resp.json()
            print("Import successful!")
            print(f"Response: {import_response}")

if __name__ == "__main__":
    asyncio.run(test_import())