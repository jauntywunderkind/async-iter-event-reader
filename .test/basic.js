#!/usr/bin/env node
/** @module - tests of basic functionality */

import tape from "tape"
import EventReader from "../event-reader.js"
import { EventEmitter} from "events"

tape( "listeners capture latter events", async function( t){
	const
		emitter= new EventEmitter(),
		reader= new EventReader({ emitter})
	// create listener
	reader.listener( "example")
	// send the event
	emitter.emit( "example", "exemplary")

	// now iterate it
	const
		iter= reader.iterator( "example"),
		first= iter.next()
	t.deepEqual( await first, { value: "exemplary", done: false})
	t.end()
})

tape( "can end iteration", async function( t){
	t.plan( 2)
	const
		emitter= new EventEmitter(),
		reader= new EventReader({ emitter}),
		iter= reader.iterator( "example"),
		listener= iter.listener

	// first value
	const first= iter.next()
	iter.return()

	t.deepEqual( await first,{ value: undefined, done: true})
	t.equal( listener.iterators.length, 0, "iterators.length=0")
	t.end()
})

tape( "can for-await loop", async function( t){
	t.plan( 3)
	const
		emitter= new EventEmitter(),
		reader= new EventReader({ emitter}),
		iter= reader.iterator( "number")

	;(async function(){
		let expected= [ 2, 4]
		for await( let value of iter){
			const next= expected.shift()
			t.equal( value, next, `value=${next}`)
		}
		t.equal( expected.length, 0, "no more expected")
		t.end()
	})();

	emitter.emit( "number", 2)
	emitter.emit( "number", 4)
	await (new Promise(res => setTimeout(res, 0)));
	iter.return()
})

tape( "multiple consumers", async function( t){
	t.plan( 6)
	const
		emitter= new EventEmitter(),
		reader= new EventReader({ emitter})

	async function doReader( name, type= "number"){
		let expected= [ 3, 6]
		for await( let value of reader.iterator( type)){
			const next= expected.shift()
			t.equal( value, next, `${name} value=${next}`)
		}
		t.equal( expected.length, 0, `${name} no more expected`)
	}
	// this is what this library was actually written to do
	doReader("a")
	doReader("b")

	emitter.emit( "number", 3)
	emitter.emit( "number", 6)
	await (new Promise(res => setTimeout(res, 0)));
	reader.listeners.number.end()
})
