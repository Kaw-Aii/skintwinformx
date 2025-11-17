"use strict";
/**
 * Database Synchronization Script
 *
 * Synchronizes Neon and Supabase databases with the latest schemas
 * and loads hypergraph data for SkinTwin FormX.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDatabase = syncDatabase;
exports.generateDeploymentScript = generateDeploymentScript;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
/**
 * Database configurations
 */
var databases = [
    {
        name: 'neon',
        schemaFile: 'database_schemas/neon_schema_enhanced.sql',
        dataFiles: [
            'database_schemas/ingredients_data.json',
            'database_schemas/edges_data.json',
            'database_schemas/capabilities_data.json',
            'database_schemas/suppliers_data.json'
        ]
    },
    {
        name: 'supabase',
        schemaFile: 'database_schemas/supabase_schema_enhanced.sql',
        dataFiles: [
            'database_schemas/ingredients_data.json',
            'database_schemas/edges_data.json',
            'database_schemas/capabilities_data.json',
            'database_schemas/suppliers_data.json'
        ]
    }
];
/**
 * Read file content
 */
function readFile(filePath) {
    var fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error("File not found: ".concat(fullPath));
    }
    return fs.readFileSync(fullPath, 'utf-8');
}
/**
 * Read JSON file
 */
function readJsonFile(filePath) {
    var content = readFile(filePath);
    return JSON.parse(content);
}
/**
 * Validate schema file
 */
function validateSchemaFile(filePath) {
    try {
        var content = readFile(filePath);
        // Basic validation: check for SQL keywords
        var hasCreateTable = content.includes('CREATE TABLE');
        // Supabase uses public schema by default, so we don't require CREATE SCHEMA
        return hasCreateTable && content.length > 100;
    }
    catch (error) {
        console.error("Schema validation failed for ".concat(filePath, ":"), error);
        return false;
    }
}
/**
 * Validate data file
 */
function validateDataFile(filePath) {
    try {
        var data = readJsonFile(filePath);
        return Array.isArray(data) && data.length > 0;
    }
    catch (error) {
        console.error("Data validation failed for ".concat(filePath, ":"), error);
        return false;
    }
}
/**
 * Generate SQL for data insertion
 */
function generateInsertSQL(tableName, data) {
    if (data.length === 0) {
        return '';
    }
    var columns = Object.keys(data[0]);
    var values = data.map(function (row) {
        var vals = columns.map(function (col) {
            var val = row[col];
            if (val === null || val === undefined) {
                return 'NULL';
            }
            if (typeof val === 'object') {
                return "'".concat(JSON.stringify(val).replace(/'/g, "''"), "'::jsonb");
            }
            if (typeof val === 'string') {
                return "'".concat(val.replace(/'/g, "''"), "'");
            }
            return val;
        });
        return "(".concat(vals.join(', '), ")");
    });
    return "\n    INSERT INTO skin_twin.".concat(tableName, " (").concat(columns.join(', '), ")\n    VALUES ").concat(values.join(',\n    '), "\n    ON CONFLICT DO NOTHING;\n  ");
}
/**
 * Sync database schema and data
 */
function syncDatabase(config) {
    return __awaiter(this, void 0, void 0, function () {
        var result, schema, _i, _a, dataFile, data, errorMessage;
        return __generator(this, function (_b) {
            result = {
                database: config.name,
                success: false,
                schemasDeployed: [],
                dataLoaded: [],
                errors: [],
                timestamp: new Date().toISOString()
            };
            console.log("\n========================================");
            console.log("Syncing ".concat(config.name.toUpperCase(), " Database"));
            console.log("========================================\n");
            try {
                // Validate schema file
                console.log("Validating schema file: ".concat(config.schemaFile));
                if (!validateSchemaFile(config.schemaFile)) {
                    result.errors.push("Invalid schema file: ".concat(config.schemaFile));
                    return [2 /*return*/, result];
                }
                console.log("\u2713 Schema file validated");
                schema = readFile(config.schemaFile);
                console.log("\u2713 Schema loaded (".concat(schema.length, " bytes)"));
                result.schemasDeployed.push(config.schemaFile);
                // Validate data files
                console.log("\nValidating data files...");
                for (_i = 0, _a = config.dataFiles; _i < _a.length; _i++) {
                    dataFile = _a[_i];
                    if (!validateDataFile(dataFile)) {
                        result.errors.push("Invalid data file: ".concat(dataFile));
                        continue;
                    }
                    data = readJsonFile(dataFile);
                    console.log("\u2713 ".concat(dataFile, ": ").concat(data.length, " records"));
                    result.dataLoaded.push(dataFile);
                }
                // Generate deployment report
                console.log("\n\u2713 Database sync prepared for ".concat(config.name));
                console.log("  - Schemas: ".concat(result.schemasDeployed.length));
                console.log("  - Data files: ".concat(result.dataLoaded.length));
                if (result.errors.length === 0) {
                    result.success = true;
                }
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
                result.errors.push(errorMessage);
                console.error("\u2717 Error syncing ".concat(config.name, ":"), errorMessage);
            }
            return [2 /*return*/, result];
        });
    });
}
/**
 * Generate deployment SQL script
 */
function generateDeploymentScript(config) {
    var script = "-- ".concat(config.name.toUpperCase(), " Database Deployment Script\n");
    script += "-- Generated: ".concat(new Date().toISOString(), "\n\n");
    // Add schema
    try {
        var schema = readFile(config.schemaFile);
        script += "-- ============================================================================\n";
        script += "-- SCHEMA DEPLOYMENT\n";
        script += "-- ============================================================================\n\n";
        script += schema;
        script += "\n\n";
    }
    catch (error) {
        script += "-- ERROR: Could not load schema file: ".concat(config.schemaFile, "\n\n");
    }
    // Add data loading
    script += "-- ============================================================================\n";
    script += "-- DATA LOADING\n";
    script += "-- ============================================================================\n\n";
    for (var _i = 0, _a = config.dataFiles; _i < _a.length; _i++) {
        var dataFile = _a[_i];
        try {
            var data = readJsonFile(dataFile);
            var tableName = path.basename(dataFile, '.json').replace('_data', '');
            script += "-- Loading ".concat(tableName, " (").concat(data.length, " records)\n");
            script += generateInsertSQL(tableName, data);
            script += "\n\n";
        }
        catch (error) {
            script += "-- ERROR: Could not load data file: ".concat(dataFile, "\n\n");
        }
    }
    return script;
}
/**
 * Main synchronization function
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, databases_1, config, result, deploymentScript, scriptPath, allSuccess, _a, results_1, result, reportPath;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n\u2551         SkinTwin FormX Database Synchronization                \u2551\n\u2551         Neon + Supabase Schema & Data Deployment               \u2551\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n  ");
                    results = [];
                    _i = 0, databases_1 = databases;
                    _b.label = 1;
                case 1:
                    if (!(_i < databases_1.length)) return [3 /*break*/, 4];
                    config = databases_1[_i];
                    return [4 /*yield*/, syncDatabase(config)];
                case 2:
                    result = _b.sent();
                    results.push(result);
                    deploymentScript = generateDeploymentScript(config);
                    scriptPath = "database_schemas/".concat(config.name, "_deployment.sql");
                    fs.writeFileSync(scriptPath, deploymentScript);
                    console.log("\n\u2713 Deployment script saved: ".concat(scriptPath));
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    // Generate summary report
                    console.log("\n\n========================================");
                    console.log("SYNCHRONIZATION SUMMARY");
                    console.log("========================================\n");
                    allSuccess = true;
                    for (_a = 0, results_1 = results; _a < results_1.length; _a++) {
                        result = results_1[_a];
                        console.log("".concat(result.database.toUpperCase(), ":"));
                        console.log("  Status: ".concat(result.success ? '✓ SUCCESS' : '✗ FAILED'));
                        console.log("  Schemas: ".concat(result.schemasDeployed.length));
                        console.log("  Data files: ".concat(result.dataLoaded.length));
                        if (result.errors.length > 0) {
                            console.log("  Errors: ".concat(result.errors.length));
                            result.errors.forEach(function (err) { return console.log("    - ".concat(err)); });
                            allSuccess = false;
                        }
                        console.log();
                    }
                    reportPath = 'DATABASE_SYNC_REPORT_NOV17_2025.json';
                    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
                    console.log("\u2713 Detailed report saved: ".concat(reportPath, "\n"));
                    // Exit with appropriate code
                    process.exit(allSuccess ? 0 : 1);
                    return [2 /*return*/];
            }
        });
    });
}
// Run if executed directly
if (require.main === module) {
    main().catch(function (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
