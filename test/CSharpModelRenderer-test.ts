import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import * as fs from "fs";
import * as path from "path";
var mock = require("mock-fs");
import CSharpModelRenderer from "../src/Output/CSharp/CSharpModelRenderer";
import {ModelViewModel} from "../src/Output/CSharp/CSharpViewModel";

chai.use(chaiAsPromised);

describe("CSharpModelRenderer", (): void => {
    afterEach(() => mock.restore());

    it("throws on invalid options", (): void => {
        const renderer: CSharpModelRenderer = new CSharpModelRenderer();
        expect(() => renderer.generateCode(null, null)).to.throw(Error);
    });

    it("renders a simple model to a single file", (done): void => {
        const renderer: CSharpModelRenderer = new CSharpModelRenderer();
        const input: ModelViewModel = {
            classes: [
                {
                    name: "CanValidate",
                    isInterface: true,
                    methods: [
                        {
                            name: "IsValid",
                            parameters:[
                                {
                                    name: "deep",
                                    isCollection: false,
                                    typeInfo: {
                                        name: "bool",
                                        isReference: false
                                    }
                                }
                            ],
                            typeInfo: {
                                name: "bool",
                                isReference: false
                            }
                        },
                        {
                            name: "Invalidate"
                        }
                    ]
                },
                {
                    name: "TestClass",
                    ctor: { parameters: [], parentParameterNames: [], relations: [] },
                    interfaceExtends: ["CanValidate"],
                    classExtends: ["TestClass"],
                    props: [{
                        name: "Prop",
                        hasConstraints: false,
                        isCollection: false,
                        typeInfo: {
                            name: "int",
                            isInterface: false,
                            isReference: false,
                            shouldMakeNullable: true
                        }
                    }]
                }
            ],
            namespace: "MyNamespace"
        };
        const expected: string =
            `using Ccmi.OntoUml.Utilities.AssociationClasses;
using Ccmi.OntoUml.Utilities.Collections;
using System;
using System.Collections.Generic;
using System.Linq;
namespace MyNamespace
{
    public interface ICanValidate
    {
        bool IsValid(bool deep);
        void Invalidate();
    }

    public interface ITestClass : ICanValidate
    {
        int? Prop { get; set; }
    }
    public class TestClass : ITestClass
    {
        public TestClass()
        {
        }
        private int? prop;
        public virtual int? Prop
        {
            get { return prop; }
            set 
            {
                prop = value;
            }
        }
        private bool isInvalidated = false;
        public virtual void Invalidate()
        {
            isInvalidated = true;
        }
        public virtual bool IsValid(bool deep)
        {
            if (isInvalidated) return false;
            return true;
        }
    }
}`.replace(/\r\n/g, "\n");
        mock({
            "testDir": {}
        });
        renderer.generateCode(input, { input: null, inputForm: null, output: "testDir/Model.cs", outputForm: null, singleFile: true })
            .then((): void => {
                const result: string = fs.readFileSync(path.join("testDir", "Model.cs"), "utf8").replace(/\r\n/g, "\n");
                expect(result).to.be.equal(expected);
            })
            .done(() => {
                done();
            });
    });

    it("renders a simple model to multiple files", (done): void => {
        const renderer: CSharpModelRenderer = new CSharpModelRenderer();
        const input: ModelViewModel = {
            classes: [
                {
                    name: "CanValidate",
                    isInterface: true,
                    methods: [
                        {
                            name: "IsValid",
                            parameters:[
                                {
                                    name: "deep",
                                    isCollection: false,
                                    typeInfo: {
                                        name: "bool",
                                        isReference: false
                                    }
                                }
                            ],
                            typeInfo: {
                                name: "bool",
                                isReference: false
                            }
                        },
                        {
                            name: "Invalidate"
                        }
                    ]
                },
                {
                    name: "TestClass",
                    ctor: { parameters: [], parentParameterNames: [], relations: [] },
                    interfaceExtends: ["CanValidate"],
                    classExtends: ["TestClass"],
                    props: [{
                        name: "Prop",
                        hasConstraints: false,
                        isCollection: false,
                        typeInfo: {
                            name: "int",
                            isInterface: false,
                            isReference: false,
                            shouldMakeNullable: true
                        }
                    }]
                }
            ],
            namespace: "MyNamespace"
        };
        const expectedCanValidate: string =
            `using Ccmi.OntoUml.Utilities.AssociationClasses;
using Ccmi.OntoUml.Utilities.Collections;
using System;
using System.Collections.Generic;
using System.Linq;
namespace MyNamespace
{
    public interface ICanValidate
    {
        bool IsValid(bool deep);
        void Invalidate();
    }
}`.replace(/\r\n/g, "\n");
        const expectedTestClass: string =
            `using Ccmi.OntoUml.Utilities.AssociationClasses;
using Ccmi.OntoUml.Utilities.Collections;
using System;
using System.Collections.Generic;
using System.Linq;
namespace MyNamespace
{
    public interface ITestClass : ICanValidate
    {
        int? Prop { get; set; }
    }
    public class TestClass : ITestClass
    {
        public TestClass()
        {
        }
        private int? prop;
        public virtual int? Prop
        {
            get { return prop; }
            set 
            {
                prop = value;
            }
        }
        private bool isInvalidated = false;
        public virtual void Invalidate()
        {
            isInvalidated = true;
        }
        public virtual bool IsValid(bool deep)
        {
            if (isInvalidated) return false;
            return true;
        }
    }
}`.replace(/\r\n/g, "\n");
        mock({
            "testDir": {}
        });
        renderer.generateCode(input, { input: null, inputForm: null, output: "testDir", outputForm: null })
            .then((): void => {
                const resultCanValidate: string = fs.readFileSync(path.join("testDir", "ICanValidate.cs"), "utf8").replace(/\r\n/g, "\n");
                const resultTestClass: string = fs.readFileSync(path.join("testDir", "TestClass.cs"), "utf8").replace(/\r\n/g, "\n");
                expect(resultCanValidate).to.be.equal(expectedCanValidate);
                expect(resultTestClass).to.be.equal(expectedTestClass);
            })
            .done(() => {
                done();
            });
    });
});